package com.thinkerlab.backend.service;

import com.thinkerlab.backend.api.Contracts.*;
import com.thinkerlab.backend.domain.*;
import com.thinkerlab.backend.domain.Types.*;
import com.thinkerlab.backend.repository.*;
import com.thinkerlab.backend.security.Actor;
import java.net.URI;
import java.time.Instant;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ProjectService {
  private final ProjectRepository projects;
  private final SourceRepository sources;
  private final OutlineRepository outlines;
  private final ContentVersionRepository versions;
  private final QualityReportRepository reports;
  private final PublicationRepository publications;
  private final AuditEventRepository audits;
  private final Actor actor;
  private final JsonStore json;

  public ProjectService(
      ProjectRepository projects,
      SourceRepository sources,
      OutlineRepository outlines,
      ContentVersionRepository versions,
      QualityReportRepository reports,
      PublicationRepository publications,
      AuditEventRepository audits,
      Actor actor,
      JsonStore json) {
    this.projects = projects;
    this.sources = sources;
    this.outlines = outlines;
    this.versions = versions;
    this.reports = reports;
    this.publications = publications;
    this.audits = audits;
    this.actor = actor;
    this.json = json;
  }

  public static ResponseStatusException error(HttpStatus status, String message) {
    return new ResponseStatusException(status, message);
  }

  public Project owned(UUID id) {
    actor.requireAuthor();
    return projects
        .findById(id)
        .filter(p -> p.ownerId.equals(actor.id()))
        .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Project tidak ditemukan."));
  }

  private void editable(Project p) {
    if (p.status == Status.PUBLISHED || p.status == Status.GENERATING)
      throw error(HttpStatus.CONFLICT, "Unpublish atau selesaikan generation sebelum mengedit.");
  }

  private void match(Project p, long revision) {
    if (p.revision != revision)
      throw error(HttpStatus.CONFLICT, "Versi project berubah. Muat ulang data.");
  }

  private void touch(Project p) {
    p.updatedAt = Instant.now();
  }

  private void audit(Project p, String action, UUID reference) {
    var a = new AuditEvent();
    a.id = UUID.randomUUID();
    a.actorId = actor.id();
    a.projectId = p.id;
    a.action = action;
    a.referenceId = reference;
    audits.save(a);
    touch(p);
  }

  public PageResult<Project> list(int page, int size) {
    actor.requireAuthor();
    var result =
        projects.findByOwnerId(
            actor.id(), PageRequest.of(page, size, Sort.by("updatedAt").descending()));
    return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
  }

  public Project create(ProjectInput in) {
    actor.requireAuthor();
    var p = new Project();
    p.id = UUID.randomUUID();
    p.ownerId = actor.id();
    apply(p, in);
    projects.save(p);
    audit(p, "PROJECT_CREATED", p.id);
    projects.flush();
    return p;
  }

  public Project update(UUID id, long revision, ProjectInput in) {
    var p = owned(id);
    match(p, revision);
    editable(p);
    apply(p, in);
    if (p.currentVersionId == null) p.approvedOutlineId = null;
    invalidate(p);
    audit(p, "PROJECT_UPDATED", p.id);
    projects.flush();
    return p;
  }

  private void apply(Project p, ProjectInput in) {
    if (in.coverImage() != null && !in.coverImage().isBlank()) httpUrl(in.coverImage());
    p.type = in.type();
    p.title = in.title().strip();
    p.description = in.description();
    p.learningGoal = in.learningGoal();
    p.audience = in.audience();
    p.targetLevel = in.targetLevel();
    p.language = in.language();
    p.writingStyle = in.writingStyle();
    p.contentLength = in.contentLength();
    p.coverImage = in.coverImage();
  }

  private void invalidate(Project p) {
    p.approvedVersionId = null;
    p.status =
        p.currentVersionId != null
            ? Status.NEEDS_REVIEW
            : p.approvedOutlineId != null ? Status.OUTLINE_REVIEW : Status.DRAFT;
  }

  public static void httpUrl(String value) {
    try {
      var u = URI.create(value);
      if (!List.of("http", "https").contains(u.getScheme())
          || u.getHost() == null
          || u.getUserInfo() != null) throw new IllegalArgumentException();
    } catch (IllegalArgumentException e) {
      throw error(HttpStatus.BAD_REQUEST, "URL harus berupa HTTP/HTTPS yang valid.");
    }
  }

  private void sourceEditable(Project p) {
    editable(p);
    if (p.approvedOutlineId != null || p.currentVersionId != null)
      throw error(
          HttpStatus.CONFLICT,
          "Sumber dibekukan setelah outline disetujui untuk menjaga citation dan versi.");
  }

  public List<Source> sources(UUID id) {
    owned(id);
    return sources.findByProjectIdOrderByCreatedAt(id);
  }

  public Source addSource(UUID id, long revision, SourceInput in) {
    var p = owned(id);
    match(p, revision);
    sourceEditable(p);
    httpUrl(in.url());
    var source = new Source();
    source.id = UUID.randomUUID();
    source.projectId = id;
    source.title = in.title();
    source.publisher = in.publisher();
    source.url = in.url();
    source.excerpt = in.excerpt();
    source.accessDate = Instant.now();
    sources.save(source);
    p.status = Status.RESEARCH_READY;
    audit(p, "SOURCE_ADDED", source.id);
    projects.flush();
    return source;
  }

  public Source selectSource(UUID id, UUID sourceId, long revision, SourceSelection in) {
    var p = owned(id);
    match(p, revision);
    sourceEditable(p);
    var s =
        sources
            .findById(sourceId)
            .filter(x -> x.projectId.equals(id))
            .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Sumber tidak ditemukan."));
    if (s.locked && !in.selected())
      throw error(HttpStatus.CONFLICT, "Buka lock sumber terlebih dahulu.");
    if (in.locked() && !in.selected())
      throw error(HttpStatus.BAD_REQUEST, "Hanya sumber terpilih yang boleh dikunci.");
    s.selected = in.selected();
    s.locked = in.locked();
    audit(p, "SOURCE_SELECTION_UPDATED", s.id);
    projects.flush();
    return s;
  }

  public void deleteSource(UUID id, UUID sourceId, long revision) {
    var p = owned(id);
    match(p, revision);
    sourceEditable(p);
    var s =
        sources
            .findById(sourceId)
            .filter(x -> x.projectId.equals(id))
            .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Sumber tidak ditemukan."));
    if (s.locked) throw error(HttpStatus.CONFLICT, "Buka lock sumber terlebih dahulu.");
    sources.delete(s);
    audit(p, "SOURCE_REMOVED", sourceId);
  }

  public Outline saveOutline(UUID id, long revision, OutlineInput in) {
    var p = owned(id);
    match(p, revision);
    editable(p);
    if (p.currentVersionId != null)
      throw error(
          HttpStatus.CONFLICT,
          "Struktur dibekukan setelah konten dibuat. Buat project baru untuk struktur berbeda.");
    if (sources.findByProjectIdOrderByCreatedAt(id).stream().noneMatch(s -> s.selected))
      throw error(HttpStatus.CONFLICT, "Pilih setidaknya satu sumber terlebih dahulu.");
    if (in.chapters().stream().map(Chapter::id).distinct().count() != in.chapters().size())
      throw error(HttpStatus.BAD_REQUEST, "ID bab harus unik.");
    var o = new Outline();
    o.id = UUID.randomUUID();
    o.projectId = id;
    o.payload = json.write(in);
    outlines.save(o);
    p.approvedOutlineId = null;
    p.status = Status.OUTLINE_REVIEW;
    audit(p, "OUTLINE_SAVED", o.id);
    projects.flush();
    return o;
  }

  public Project approveOutline(UUID id, UUID outlineId, long revision) {
    var p = owned(id);
    match(p, revision);
    editable(p);
    if (p.currentVersionId != null)
      throw error(HttpStatus.CONFLICT, "Outline konten yang sudah dibuat tidak boleh diganti.");
    var o =
        outlines
            .findById(outlineId)
            .filter(x -> x.projectId.equals(id))
            .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Outline tidak ditemukan."));
    var latest = outlines.findByProjectIdOrderByCreatedAtDesc(id);
    if (latest.isEmpty() || !latest.getFirst().id.equals(outlineId))
      throw error(HttpStatus.CONFLICT, "Hanya outline terbaru yang dapat disetujui.");
    if (sources.findByProjectIdOrderByCreatedAt(id).stream().noneMatch(s -> s.selected))
      throw error(HttpStatus.CONFLICT, "Pilih sumber sebelum approval.");
    o.approvedAt = Instant.now();
    p.approvedOutlineId = o.id;
    p.status = Status.OUTLINE_REVIEW;
    audit(p, "OUTLINE_APPROVED", o.id);
    projects.flush();
    return p;
  }

  public List<Map<String, Object>> outlines(UUID id) {
    owned(id);
    return outlines.findByProjectIdOrderByCreatedAtDesc(id).stream()
        .map(
            o -> {
              Map<String, Object> result = new LinkedHashMap<>();
              result.put("id", o.id);
              result.put("outline", json.read(o.payload, OutlineInput.class));
              result.put("approvedAt", o.approvedAt);
              result.put("createdAt", o.createdAt);
              return result;
            })
        .toList();
  }

  public Map<String, Object> outlineView(Outline o) {
    return Map.of("id", o.id, "outline", json.read(o.payload, OutlineInput.class));
  }

  public ContentVersion saveContent(UUID id, long revision, ContentInput in) {
    var p = owned(id);
    match(p, revision);
    editable(p);
    if (p.approvedOutlineId == null)
      throw error(HttpStatus.CONFLICT, "Setujui outline sebelum menyimpan konten.");
    validateContent(p, in);
    var v = new ContentVersion();
    v.id = UUID.randomUUID();
    v.projectId = id;
    v.outlineId = p.approvedOutlineId;
    v.payload = json.write(in);
    v.createdBy = actor.id();
    versions.save(v);
    p.currentVersionId = v.id;
    p.approvedVersionId = null;
    p.status = Status.NEEDS_REVIEW;
    audit(p, "CONTENT_SAVED", v.id);
    projects.flush();
    return v;
  }

  private void validateContent(Project p, ContentInput input) {
    var outline =
        json.read(outlines.findById(p.approvedOutlineId).orElseThrow().payload, OutlineInput.class);
    var expected = outline.chapters().stream().map(Chapter::id).toList();
    if (!expected.equals(input.chapters().stream().map(ChapterContent::chapterId).toList()))
      throw error(HttpStatus.BAD_REQUEST, "Bab harus cocok dengan urutan outline yang disetujui.");
    var selected =
        sources.findByProjectIdOrderByCreatedAt(p.id).stream()
            .filter(s -> s.selected)
            .map(s -> s.id)
            .toList();
    var ids = new HashSet<String>();
    for (var chapter : input.chapters())
      for (var block : chapter.blocks()) {
        if (!ids.add(block.id()))
          throw error(HttpStatus.BAD_REQUEST, "ID block harus unik dalam ebook.");
        if (block.sourceId() != null && !selected.contains(block.sourceId()))
          throw error(
              HttpStatus.BAD_REQUEST, "Citation harus merujuk sumber terpilih milik project ini.");
      }
  }

  public ContentVersion current(Project p) {
    if (p.currentVersionId == null) throw error(HttpStatus.CONFLICT, "Belum ada konten.");
    return versions.findById(p.currentVersionId).orElseThrow();
  }

  public Map<String, Object> contentView(ContentVersion v) {
    return Map.of(
        "id",
        v.id,
        "outlineId",
        v.outlineId,
        "createdAt",
        v.createdAt,
        "content",
        json.read(v.payload, ContentInput.class));
  }

  public List<Map<String, Object>> versions(UUID id) {
    owned(id);
    return versions.findByProjectIdOrderByCreatedAtDesc(id).stream()
        .map(this::contentView)
        .toList();
  }

  public Map<String, Object> content(UUID id) {
    return contentView(current(owned(id)));
  }

  public ContentVersion restore(UUID id, UUID versionId, long revision) {
    var p = owned(id);
    var old =
        versions
            .findById(versionId)
            .filter(v -> v.projectId.equals(id))
            .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Versi tidak ditemukan."));
    if (!old.outlineId.equals(p.approvedOutlineId))
      throw error(HttpStatus.CONFLICT, "Outline versi ini berbeda.");
    var restored = saveContent(id, revision, json.read(old.payload, ContentInput.class));
    audit(p, "CONTENT_RESTORED", versionId);
    return restored;
  }

  public QualityResult check(UUID id, long revision) {
    var p = owned(id);
    match(p, revision);
    editable(p);
    var v = current(p);
    var content = json.read(v.payload, ContentInput.class);
    List<QualityIssue> issues = new ArrayList<>();
    Set<String> paragraphs = new HashSet<>();
    for (var chapter : content.chapters()) {
      boolean cited = false;
      for (var b : chapter.blocks()) {
        if (b.sourceId() != null) cited = true;
        if (b.type() == BlockType.citation && b.sourceId() == null)
          issues.add(
              new QualityIssue(
                  "MISSING_SOURCE", "BLOCKER", "Citation tidak memiliki sourceId.", b.id()));
        if (b.content().isBlank() && (b.items() == null || b.items().isEmpty()))
          issues.add(new QualityIssue("EMPTY_BLOCK", "BLOCKER", "Isi block kosong.", b.id()));
        if (b.type() == BlockType.paragraph
            && !paragraphs.add(b.content().strip().toLowerCase(Locale.ROOT)))
          issues.add(
              new QualityIssue(
                  "DUPLICATE_PARAGRAPH", "WARNING", "Paragraf identik ditemukan.", b.id()));
        if (b.type() == BlockType.image || b.type() == BlockType.quiz)
          issues.add(
              new QualityIssue(
                  "MANUAL_BLOCK_REVIEW",
                  "WARNING",
                  "Periksa block image/quiz secara manual.",
                  b.id()));
      }
      if (!cited)
        issues.add(
            new QualityIssue(
                "UNCITED_CHAPTER",
                "BLOCKER",
                "Bab " + chapter.title() + " belum memiliki citation.",
                null));
    }
    var result =
        new QualityResult(
            v.id,
            issues.stream().noneMatch(i -> i.severity().equals("BLOCKER")),
            issues,
            "STRUCTURAL_ONLY: bukan verifikasi fakta, readability, safety, atau copyright; author"
                + " wajib review manual.");
    var report = new QualityReport();
    report.id = UUID.randomUUID();
    report.projectId = id;
    report.contentVersionId = v.id;
    report.passed = result.passed();
    report.payload = json.write(result);
    reports.save(report);
    p.approvedVersionId = null;
    p.status = Status.NEEDS_REVIEW;
    audit(p, "QUALITY_CHECKED", report.id);
    projects.flush();
    return result;
  }

  public QualityResult quality(UUID id) {
    var p = owned(id);
    var v = current(p);
    return reports
        .findFirstByContentVersionIdOrderByCreatedAtDesc(v.id)
        .map(r -> json.read(r.payload, QualityResult.class))
        .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Jalankan quality check terlebih dahulu."));
  }

  public Project approve(UUID id, long revision, Approval in) {
    var p = owned(id);
    match(p, revision);
    editable(p);
    if (!in.humanReviewConfirmed() || !in.contentVersionId().equals(p.currentVersionId))
      throw error(HttpStatus.CONFLICT, "Review manusia harus menyetujui versi saat ini.");
    if (!quality(id).passed())
      throw error(HttpStatus.CONFLICT, "Perbaiki quality blocker sebelum approval.");
    p.approvedVersionId = p.currentVersionId;
    p.status = Status.APPROVED;
    audit(p, "CONTENT_APPROVED", p.currentVersionId);
    projects.flush();
    return p;
  }

  public Publication publish(UUID id, long revision) {
    var p = owned(id);
    var existing = publications.findByProjectId(id);
    if (p.status == Status.PUBLISHED
        && existing.isPresent()
        && existing.get().published
        && existing.get().contentVersionId.equals(p.currentVersionId)) return existing.get();
    match(p, revision);
    if (p.status != Status.APPROVED
        || p.approvedVersionId == null
        || !p.approvedVersionId.equals(p.currentVersionId))
      throw error(HttpStatus.CONFLICT, "Hanya versi yang sudah disetujui dapat dipublikasikan.");
    var pub = existing.orElseGet(Publication::new);
    if (pub.id == null) {
      pub.id = UUID.randomUUID();
      pub.projectId = id;
      pub.slug = "ebook-" + id;
    }
    pub.contentVersionId = p.currentVersionId;
    pub.title = p.title;
    pub.description = p.description;
    pub.coverImage = p.coverImage;
    pub.published = true;
    pub.publishedAt = Instant.now();
    publications.save(pub);
    p.status = Status.PUBLISHED;
    audit(p, "PUBLISHED", pub.id);
    projects.flush();
    return pub;
  }

  public Project unpublish(UUID id, long revision) {
    var p = owned(id);
    match(p, revision);
    var pub =
        publications
            .findByProjectId(id)
            .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Publikasi belum ada."));
    pub.published = false;
    p.status = Status.UNPUBLISHED;
    p.approvedVersionId = null;
    audit(p, "UNPUBLISHED", pub.id);
    projects.flush();
    return p;
  }

  public List<AuditEvent> auditTrail(UUID id) {
    owned(id);
    return audits.findByProjectIdOrderByCreatedAtDesc(id);
  }
}

package com.thinkerlab.backend.service;

import com.thinkerlab.backend.api.Contracts.*;
import com.thinkerlab.backend.domain.*;
import com.thinkerlab.backend.repository.*;
import com.thinkerlab.backend.security.Actor;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReaderService {
  private final PublicationRepository publications;
  private final ContentVersionRepository versions;
  private final ReadingProgressRepository progress;
  private final IssueRepository issues;
  private final SourceRepository sources;
  private final Actor actor;
  private final JsonStore json;

  public ReaderService(
      PublicationRepository publications,
      ContentVersionRepository versions,
      ReadingProgressRepository progress,
      IssueRepository issues,
      SourceRepository sources,
      Actor actor,
      JsonStore json) {
    this.publications = publications;
    this.versions = versions;
    this.progress = progress;
    this.issues = issues;
    this.sources = sources;
    this.actor = actor;
    this.json = json;
  }

  public PageResult<Publication> library(String search, int page, int size) {
    var result =
        publications.findByPublishedTrueAndTitleContainingIgnoreCase(
            search, PageRequest.of(page, size, Sort.by("publishedAt").descending()));
    return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
  }

  private Publication visible(UUID id) {
    return publications
        .findById(id)
        .filter(p -> p.published)
        .orElseThrow(
            () -> ProjectService.error(HttpStatus.NOT_FOUND, "Publikasi tidak ditemukan."));
  }

  private ContentInput content(Publication pub) {
    return json.read(
        versions.findById(pub.contentVersionId).orElseThrow().payload, ContentInput.class);
  }

  public Map<String, Object> read(UUID id) {
    var p = visible(id);
    var c = content(p);
    var cited = new HashSet<UUID>();
    for (var chapter : c.chapters())
      for (var block : chapter.blocks()) if (block.sourceId() != null) cited.add(block.sourceId());
    // Only public citation metadata; private supplied excerpts never leave the author API.
    var refs =
        sources.findByProjectIdOrderByCreatedAt(p.projectId).stream()
            .filter(s -> cited.contains(s.id))
            .map(
                s ->
                    Map.of(
                        "id",
                        s.id,
                        "title",
                        s.title,
                        "url",
                        s.url,
                        "publisher",
                        s.publisher,
                        "accessDate",
                        s.accessDate))
            .toList();
    return Map.of("publication", p, "content", c, "sources", refs);
  }

  public Map<String, Object> progress(UUID id) {
    var p = visible(id);
    var saved =
        progress
            .findByUserIdAndPublicationId(actor.id(), id)
            .filter(r -> r.contentVersionId.equals(p.contentVersionId));
    return Map.of(
        "publicationId",
        id,
        "contentVersionId",
        p.contentVersionId,
        "chapterIndex",
        saved.map(r -> r.chapterIndex).orElse(0),
        "completion",
        saved.map(r -> r.completion).orElse(0));
  }

  public ReadingProgress saveProgress(UUID id, ProgressInput in) {
    var p = visible(id);
    if (!p.contentVersionId.equals(in.contentVersionId()))
      throw ProjectService.error(HttpStatus.CONFLICT, "Konten diperbarui. Muat ulang reader.");
    if (in.chapterIndex() >= content(p).chapters().size())
      throw ProjectService.error(HttpStatus.BAD_REQUEST, "Indeks bab tidak valid.");
    var r = progress.findByUserIdAndPublicationId(actor.id(), id).orElseGet(ReadingProgress::new);
    if (r.id == null) {
      r.id = UUID.randomUUID();
      r.userId = actor.id();
      r.publicationId = id;
    }
    r.contentVersionId = p.contentVersionId;
    r.chapterIndex = in.chapterIndex();
    r.completion = in.completion();
    return progress.save(r);
  }

  public Issue report(UUID id, IssueInput in) {
    var p = visible(id);
    if (in.blockId() != null
        && content(p).chapters().stream()
            .flatMap(c -> c.blocks().stream())
            .noneMatch(b -> b.id().equals(in.blockId())))
      throw ProjectService.error(HttpStatus.BAD_REQUEST, "Block tidak ditemukan.");
    var issue = new Issue();
    issue.id = UUID.randomUUID();
    issue.publicationId = id;
    issue.reportedBy = actor.id();
    issue.blockId = in.blockId();
    issue.message = in.message();
    return issues.save(issue);
  }
}

package com.thinkerlab.backend.service;

import com.thinkerlab.backend.api.request.*;
import com.thinkerlab.backend.domain.Project;
import jakarta.validation.Validator;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** No DB transaction is held open while awaiting the remote model. */
@Service
public class AiService {
  private final ProjectService projects;
  private final GeminiService gemini;
  private final JsonStore json;
  private final Validator validator;
  private final Set<UUID> active = ConcurrentHashMap.newKeySet();

  public AiService(
      ProjectService projects, GeminiService gemini, JsonStore json, Validator validator) {
    this.projects = projects;
    this.gemini = gemini;
    this.json = json;
    this.validator = validator;
  }

  private Project begin(UUID id, long revision) {
    var p = projects.owned(id);
    if (p.revision != revision)
      throw ProjectService.error(HttpStatus.CONFLICT, "Project berubah. Muat ulang.");
    if (p.status == com.thinkerlab.backend.domain.Types.Status.PUBLISHED)
      throw ProjectService.error(HttpStatus.CONFLICT, "Unpublish sebelum mengubah ebook.");
    if (!active.add(id))
      throw ProjectService.error(
          HttpStatus.CONFLICT, "AI sedang memproses project ini. Tunggu sampai selesai.");
    return p;
  }

  private String context(Project p) {
    var selected = projects.sources(p.id).stream().filter(s -> s.selected).toList();
    if (selected.isEmpty()
        || selected.stream().anyMatch(s -> s.excerpt == null || s.excerpt.isBlank()))
      throw ProjectService.error(
          HttpStatus.CONFLICT,
          "Tambahkan kutipan/isi untuk setiap sumber terpilih sebelum memakai AI.");
    int length = selected.stream().mapToInt(s -> s.excerpt.length()).sum();
    if (length > 60000)
      throw ProjectService.error(
          HttpStatus.BAD_REQUEST,
          "Total kutipan sumber maksimal 60.000 karakter untuk satu permintaan AI.");
    return "PROJECT DATA: "
        + json.write(
            Map.of(
                "title",
                p.title,
                "goal",
                p.learningGoal,
                "language",
                p.language,
                "level",
                p.targetLevel,
                "style",
                p.writingStyle,
                "length",
                p.contentLength))
        + "\nSOURCE DATA: "
        + json.write(
            selected.stream()
                .map(s -> Map.of("id", s.id, "title", s.title, "excerpt", s.excerpt))
                .toList());
  }

  private <T> T valid(T result) {
    if (result == null || !validator.validate(result).isEmpty())
      throw ProjectService.error(
          HttpStatus.BAD_GATEWAY, "Format jawaban AI tidak valid. Coba lagi.");
    return result;
  }

  public Map<String, Object> outline(UUID id, long revision) {
    var p = begin(id, revision);
    try {
      if (p.currentVersionId != null)
        throw ProjectService.error(
            HttpStatus.CONFLICT, "Konten sudah ada; struktur outline dibekukan.");
      String prompt =
          context(p)
              + "\n"
              + "Create a focused outline with 3 to 5 chapters, matching the requested language and"
              + " learning goal. Return JSON:"
              + " {\"title\":\"...\",\"learningOutcomes\":[\"...\"],\"chapters\":[{\"id\":\"chapter-1\",\"title\":\"...\",\"lessons\":2}]}.";
      var result = valid(gemini.generate(prompt, OutlineInput.class));
      return projects.outlineView(projects.saveOutline(id, revision, result));
    } finally {
      active.remove(id);
    }
  }

  public Map<String, Object> content(UUID id, long revision) {
    var p = begin(id, revision);
    try {
      if (p.approvedOutlineId == null)
        throw ProjectService.error(HttpStatus.CONFLICT, "Setujui outline terlebih dahulu.");
      if (p.currentVersionId != null) return projects.content(id);
      var outline =
          projects.outlines(id).stream()
              .filter(o -> p.approvedOutlineId.equals(o.get("id")))
              .findFirst()
              .orElseThrow();
      String prompt =
          context(p)
              + "\nAPPROVED OUTLINE: "
              + json.write(outline.get("outline"))
              + "\n"
              + "Write all approved chapters in EXACT order and with EXACT chapter IDs. For Short"
              + " write about 150 words per chapter, Medium 250, Long 350. Explain clearly, include"
              + " an example and limitations. Cite only the supplied source that supports the"
              + " claim, using its exact UUID. No invented quotes or URLs. Every chapter must"
              + " include at least one citation block. Block IDs must be unique across the entire"
              + " ebook. Return JSON"
              + " {\"chapters\":[{\"chapterId\":\"chapter-1\",\"title\":\"...\",\"blocks\":[{\"id\":\"c1-p1\",\"type\":\"paragraph\",\"content\":\"...\"},{\"id\":\"c1-ref1\",\"type\":\"citation\",\"content\":\"Source"
              + " title\",\"sourceId\":\"source UUID\",\"citationLabel\":\"[1]\"}]}]}. Allowed"
              + " block types: heading, paragraph, list, callout, citation. Lists may include items"
              + " array of strings.";
      var result = valid(gemini.generate(prompt, ContentInput.class));
      return projects.contentView(projects.saveContent(id, revision, result));
    } finally {
      active.remove(id);
    }
  }
}

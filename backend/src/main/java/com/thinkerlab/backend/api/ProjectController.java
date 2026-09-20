package com.thinkerlab.backend.api;

import com.thinkerlab.backend.api.Contracts.*;
import com.thinkerlab.backend.domain.*;
import com.thinkerlab.backend.service.ProjectService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ebooks")
@Validated
public class ProjectController {
  private final ProjectService service;

  public ProjectController(ProjectService service) {
    this.service = service;
  }

  // All mutations of an existing project require the revision returned by GET /ebooks/{id}.
  static long revision(String header) {
    try {
      long n = Long.parseLong(header.replace("\"", ""));
      if (n < 0) throw new NumberFormatException();
      return n;
    } catch (NumberFormatException e) {
      throw ProjectService.error(
          HttpStatus.BAD_REQUEST, "If-Match harus berisi revision numerik project.");
    }
  }

  @GetMapping
  public PageResult<Project> list(
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
    return service.list(page, size);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Project create(@Valid @RequestBody ProjectInput input) {
    return service.create(input);
  }

  @GetMapping("/{id}")
  public Project get(@PathVariable UUID id) {
    return service.owned(id);
  }

  @PutMapping("/{id}")
  public Project update(
      @PathVariable UUID id,
      @RequestHeader("If-Match") String rev,
      @Valid @RequestBody ProjectInput input) {
    return service.update(id, revision(rev), input);
  }

  @GetMapping("/{id}/sources")
  public List<Source> sources(@PathVariable UUID id) {
    return service.sources(id);
  }

  @PostMapping("/{id}/sources")
  @ResponseStatus(HttpStatus.CREATED)
  public Source addSource(
      @PathVariable UUID id,
      @RequestHeader("If-Match") String rev,
      @Valid @RequestBody SourceInput input) {
    return service.addSource(id, revision(rev), input);
  }

  @PatchMapping("/{id}/sources/{sourceId}")
  public Source select(
      @PathVariable UUID id,
      @PathVariable UUID sourceId,
      @RequestHeader("If-Match") String rev,
      @RequestBody SourceSelection input) {
    return service.selectSource(id, sourceId, revision(rev), input);
  }

  @DeleteMapping("/{id}/sources/{sourceId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void remove(
      @PathVariable UUID id, @PathVariable UUID sourceId, @RequestHeader("If-Match") String rev) {
    service.deleteSource(id, sourceId, revision(rev));
  }

  @GetMapping("/{id}/outlines")
  public List<Map<String, Object>> outlines(@PathVariable UUID id) {
    return service.outlines(id);
  }

  @PostMapping("/{id}/outlines")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> outline(
      @PathVariable UUID id,
      @RequestHeader("If-Match") String rev,
      @Valid @RequestBody OutlineInput input) {
    return service.outlineView(service.saveOutline(id, revision(rev), input));
  }

  @PostMapping("/{id}/outlines/{outlineId}/approve")
  public Project approveOutline(
      @PathVariable UUID id, @PathVariable UUID outlineId, @RequestHeader("If-Match") String rev) {
    return service.approveOutline(id, outlineId, revision(rev));
  }

  @GetMapping("/{id}/content")
  public Map<String, Object> content(@PathVariable UUID id) {
    return service.content(id);
  }

  @PutMapping("/{id}/content")
  public Map<String, Object> save(
      @PathVariable UUID id,
      @RequestHeader("If-Match") String rev,
      @Valid @RequestBody ContentInput input) {
    return service.contentView(service.saveContent(id, revision(rev), input));
  }

  @GetMapping("/{id}/versions")
  public List<Map<String, Object>> versions(@PathVariable UUID id) {
    return service.versions(id);
  }

  @PostMapping("/{id}/versions/{versionId}/restore")
  public Map<String, Object> restore(
      @PathVariable UUID id, @PathVariable UUID versionId, @RequestHeader("If-Match") String rev) {
    return service.contentView(service.restore(id, versionId, revision(rev)));
  }

  @PostMapping("/{id}/quality-check")
  public QualityResult check(@PathVariable UUID id, @RequestHeader("If-Match") String rev) {
    return service.check(id, revision(rev));
  }

  @GetMapping("/{id}/quality-check")
  public QualityResult quality(@PathVariable UUID id) {
    return service.quality(id);
  }

  @PostMapping("/{id}/approve")
  public Project approve(
      @PathVariable UUID id,
      @RequestHeader("If-Match") String rev,
      @Valid @RequestBody Approval input) {
    return service.approve(id, revision(rev), input);
  }

  @PostMapping("/{id}/publish")
  public Publication publish(@PathVariable UUID id, @RequestHeader("If-Match") String rev) {
    return service.publish(id, revision(rev));
  }

  @PostMapping("/{id}/unpublish")
  public Project unpublish(@PathVariable UUID id, @RequestHeader("If-Match") String rev) {
    return service.unpublish(id, revision(rev));
  }

  @GetMapping("/{id}/audit")
  public List<AuditEvent> audit(@PathVariable UUID id) {
    return service.auditTrail(id);
  }
}

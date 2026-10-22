package com.thinkerlab.backend.controller;

import com.thinkerlab.backend.service.AiService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ebooks/{id}/ai")
public class AiController {
  private final AiService ai;

  public AiController(AiService ai) {
    this.ai = ai;
  }

  @GetMapping("/research")
  public Map<String, Object> research(@PathVariable UUID id) {
    return ai.researchView(id);
  }

  @PostMapping("/research")
  public Map<String, Object> research(@PathVariable UUID id,
      @RequestHeader("If-Match") String revision,
      @RequestParam(defaultValue = "false") boolean refresh) {
    return ai.research(id, ProjectController.revision(revision), refresh);
  }

  @PostMapping("/outline")
  public Map<String, Object> outline(
      @PathVariable UUID id, @RequestHeader("If-Match") String revision) {
    return ai.outline(id, ProjectController.revision(revision));
  }

  @PostMapping("/outline/finalize")
  public Map<String, Object> finalizeOutline(@PathVariable UUID id,
      @RequestHeader("If-Match") String revision,
      @jakarta.validation.Valid @RequestBody com.thinkerlab.backend.api.request.ChapterSelection selection) {
    return ai.finalizeOutline(id, ProjectController.revision(revision), selection);
  }

  @PostMapping("/content")
  public Map<String, Object> content(
      @PathVariable UUID id, @RequestHeader("If-Match") String revision) {
    return ai.content(id, ProjectController.revision(revision));
  }
}

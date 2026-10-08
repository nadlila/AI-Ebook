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

  @PostMapping("/outline")
  public Map<String, Object> outline(
      @PathVariable UUID id, @RequestHeader("If-Match") String revision) {
    return ai.outline(id, ProjectController.revision(revision));
  }

  @PostMapping("/content")
  public Map<String, Object> content(
      @PathVariable UUID id, @RequestHeader("If-Match") String revision) {
    return ai.content(id, ProjectController.revision(revision));
  }
}

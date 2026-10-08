package com.thinkerlab.backend.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Lets the frontend hide actions whose external services are not implemented yet. */
@RestController
public class CapabilityController {
  private final com.thinkerlab.backend.service.GeminiService gemini;

  public CapabilityController(com.thinkerlab.backend.service.GeminiService gemini) {
    this.gemini = gemini;
  }

  @GetMapping("/api/capabilities")
  public Map<String, Object> capabilities() {
    return Map.of(
        "authentication", "SUPABASE_AUTH",
        "roles", new String[] {"AUTHOR"},
        "providedSources", true,
        "manualOutlineAndContent", true,
        "versioningAndPublishing", true,
        "qualityCheckScope", "STRUCTURAL_ONLY",
        "aiResearch", gemini.configured(),
        "aiGeneration", gemini.configured(),
        "backgroundJobs", false);
  }
}

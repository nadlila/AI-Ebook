package com.thinkerlab.backend.api;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Lets the frontend hide actions whose external services are not implemented yet. */
@RestController
public class CapabilityController {
  @GetMapping("/api/capabilities")
  public Map<String, Object> capabilities() {
    return Map.of(
        "authentication", "SUPABASE_AUTH",
        "roles", new String[] {"AUTHOR", "READER"},
        "providedSources", true,
        "manualOutlineAndContent", true,
        "versioningAndPublishing", true,
        "qualityCheckScope", "STRUCTURAL_ONLY",
        "aiResearch", false,
        "aiGeneration", false,
        "backgroundJobs", false);
  }
}

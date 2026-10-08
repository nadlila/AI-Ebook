package com.thinkerlab.backend.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
public class PublicConfigController {
  private final String url, key;

  public PublicConfigController(
      @Value("${SUPABASE_URL:}") String url, @Value("${SUPABASE_PUBLISHABLE_KEY:}") String key) {
    this.url = url;
    this.key = key;
  }

  @GetMapping("/api/config")
  public Map<String, String> config() {
    // Only publishable keys may cross the browser boundary. Never expose secret/service-role keys.
    return Map.of(
        "supabaseUrl", url, "supabasePublishableKey", key.startsWith("sb_publishable_") ? key : "");
  }
}

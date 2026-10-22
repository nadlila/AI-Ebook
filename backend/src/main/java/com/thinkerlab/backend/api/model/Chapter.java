package com.thinkerlab.backend.api.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record Chapter(
    @NotBlank @Size(max = 100) String id,
    @NotBlank @Size(max = 200) String title,
    @Min(1) @Max(100) int lessons,
    @Size(max = 2000) String description,
    @Min(0) @Max(10000) Integer estimatedWords,
    com.thinkerlab.backend.domain.Types.Level level) {
  public Chapter { estimatedWords = estimatedWords == null ? 0 : estimatedWords; }
  public Chapter(String id, String title, int lessons, String description, Integer estimatedWords) {
    this(id, title, lessons, description, estimatedWords, null);
  }
  public Chapter(String id, String title, int lessons) { this(id, title, lessons, null, 0); }
}

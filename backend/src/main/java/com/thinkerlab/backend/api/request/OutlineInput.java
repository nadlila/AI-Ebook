package com.thinkerlab.backend.api.request;

import com.thinkerlab.backend.api.model.Chapter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record OutlineInput(
    @NotBlank @Size(max = 200) String title,
    @NotEmpty @Size(max = 50) List<@NotBlank @Size(max = 2000) String> learningOutcomes,
    @NotEmpty @Size(max = 50) List<@Valid Chapter> chapters,
    @Size(max = 100) String estimatedReadingTime) {
  public OutlineInput(String title, List<String> learningOutcomes, List<Chapter> chapters) {
    this(title, learningOutcomes, chapters, null);
  }
}

package com.thinkerlab.backend.api;

import com.thinkerlab.backend.domain.Types.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;

public final class Contracts {
  private Contracts() {}

  public record ProjectInput(
      @NotNull ContentType type,
      @NotBlank @Size(max = 200) String title,
      @Size(max = 10000) String description,
      @NotBlank @Size(max = 4000) String learningGoal,
      @NotBlank @Size(max = 500) String audience,
      @NotNull Level targetLevel,
      @NotBlank @Size(max = 64) String language,
      @NotBlank @Size(max = 100) String writingStyle,
      @NotNull Length contentLength,
      @Size(max = 2048) String coverImage) {}

  public record SourceInput(
      @NotBlank @Size(max = 200) String title,
      @NotBlank @Size(max = 200) String publisher,
      @NotBlank @Size(max = 2048) String url,
      @NotBlank @Size(max = 50000) String excerpt) {}

  public record SourceSelection(boolean selected, boolean locked) {}

  public record Chapter(
      @NotBlank @Size(max = 100) String id,
      @NotBlank @Size(max = 200) String title,
      @Min(1) @Max(100) int lessons) {}

  public record OutlineInput(
      @NotBlank @Size(max = 200) String title,
      @NotEmpty @Size(max = 50) List<@NotBlank @Size(max = 2000) String> learningOutcomes,
      @NotEmpty @Size(max = 50) List<@Valid Chapter> chapters) {}

  public record Block(
      @NotBlank @Size(max = 100) String id,
      @NotNull BlockType type,
      @NotNull @Size(max = 30000) String content,
      @Size(max = 100) List<@NotBlank @Size(max = 3000) String> items,
      UUID sourceId,
      @Size(max = 200) String citationLabel) {}

  public record ChapterContent(
      @NotBlank @Size(max = 100) String chapterId,
      @NotBlank @Size(max = 200) String title,
      @NotEmpty @Size(max = 500) List<@Valid Block> blocks) {}

  public record ContentInput(@NotEmpty @Size(max = 50) List<@Valid ChapterContent> chapters) {}

  public record Approval(
      @NotNull UUID contentVersionId, @AssertTrue boolean humanReviewConfirmed) {}

  public record ProgressInput(
      @NotNull UUID contentVersionId, @Min(0) int chapterIndex, @Min(0) @Max(100) int completion) {}

  public record IssueInput(
      @Size(max = 100) String blockId, @NotBlank @Size(max = 2000) String message) {}

  public record QualityIssue(String code, String severity, String description, String blockId) {}

  public record QualityResult(
      UUID contentVersionId, boolean passed, List<QualityIssue> issues, String scope) {}

  public record PageResult<T>(List<T> items, long totalElements, int page, int size) {}
}

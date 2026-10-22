package com.thinkerlab.backend.api.request;
import jakarta.validation.constraints.*;
import java.util.List;
public record ChapterSelection(@NotEmpty @Size(max = 50) List<@NotBlank String> chapterIds) {}

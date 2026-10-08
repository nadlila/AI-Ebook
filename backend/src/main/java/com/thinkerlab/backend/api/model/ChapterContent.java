package com.thinkerlab.backend.api.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ChapterContent(
    @NotBlank @Size(max = 100) String chapterId,
    @NotBlank @Size(max = 200) String title,
    @NotEmpty @Size(max = 500) List<@Valid Block> blocks) {}

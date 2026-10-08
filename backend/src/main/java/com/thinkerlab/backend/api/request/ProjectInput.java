package com.thinkerlab.backend.api.request;

import com.thinkerlab.backend.domain.Types.ContentType;
import com.thinkerlab.backend.domain.Types.Length;
import com.thinkerlab.backend.domain.Types.Level;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

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
    @Size(max = 350000) String coverImage) {}

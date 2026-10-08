package com.thinkerlab.backend.api.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ProgressInput(
    @NotNull UUID contentVersionId, @Min(0) int chapterIndex, @Min(0) @Max(100) int completion) {}

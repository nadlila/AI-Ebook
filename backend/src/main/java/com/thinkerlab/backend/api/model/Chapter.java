package com.thinkerlab.backend.api.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record Chapter(
    @NotBlank @Size(max = 100) String id,
    @NotBlank @Size(max = 200) String title,
    @Min(1) @Max(100) int lessons) {}

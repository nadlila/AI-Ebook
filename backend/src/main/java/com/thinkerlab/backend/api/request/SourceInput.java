package com.thinkerlab.backend.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SourceInput(
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 200) String publisher,
    @NotBlank @Size(max = 2048) String url,
    @NotBlank @Size(max = 50000) String excerpt) {}

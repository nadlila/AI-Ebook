package com.thinkerlab.backend.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IssueInput(
    @Size(max = 100) String blockId, @NotBlank @Size(max = 2000) String message) {}

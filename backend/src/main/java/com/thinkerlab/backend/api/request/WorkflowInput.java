package com.thinkerlab.backend.api.request;
import jakarta.validation.constraints.*;
public record WorkflowInput(
    @NotBlank @Pattern(regexp = "LEARNING_PREFERENCES|RESEARCH|SOURCE_REVIEW|LEARNING_PLAN|OUTLINE|OUTLINE_APPROVAL|GENERATION|EDITOR|QUALITY_CHECK|DETAIL") String step,
    @Size(max = 1000000) String draft) {}

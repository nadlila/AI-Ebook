package com.thinkerlab.backend.api.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record Approval(@NotNull UUID contentVersionId, @AssertTrue boolean humanReviewConfirmed) {}

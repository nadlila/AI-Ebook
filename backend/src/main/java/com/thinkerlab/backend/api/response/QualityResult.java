package com.thinkerlab.backend.api.response;

import java.util.List;
import java.util.UUID;

public record QualityResult(
    UUID contentVersionId, boolean passed, List<QualityIssue> issues, String scope) {}

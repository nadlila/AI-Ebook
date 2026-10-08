package com.thinkerlab.backend.api.response;

public record QualityIssue(String code, String severity, String description, String blockId) {}

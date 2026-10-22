package com.thinkerlab.backend.api.model;
import java.util.*;
public record GenerationDraft(UUID outlineId, List<ChapterContent> chapters) {}

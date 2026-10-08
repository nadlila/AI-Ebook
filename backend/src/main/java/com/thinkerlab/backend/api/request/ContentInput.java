package com.thinkerlab.backend.api.request;

import com.thinkerlab.backend.api.model.ChapterContent;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ContentInput(@NotEmpty @Size(max = 50) List<@Valid ChapterContent> chapters) {}

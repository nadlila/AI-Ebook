package com.thinkerlab.backend.api.model;

import com.thinkerlab.backend.domain.Types.BlockType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record Block(
    @NotBlank @Size(max = 100) String id,
    @NotNull BlockType type,
    @NotNull @Size(max = 30000) String content,
    @Size(max = 100) List<@NotBlank @Size(max = 3000) String> items,
    UUID sourceId,
    @Size(max = 200) String citationLabel) {}

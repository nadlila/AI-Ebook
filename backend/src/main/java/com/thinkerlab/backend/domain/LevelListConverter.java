package com.thinkerlab.backend.domain;
import jakarta.persistence.*;
import java.util.*;
@Converter
public class LevelListConverter implements AttributeConverter<List<Types.Level>, String> {
  public String convertToDatabaseColumn(List<Types.Level> levels) {
    return levels == null ? null : levels.stream().map(Enum::name).collect(java.util.stream.Collectors.joining(","));
  }
  public List<Types.Level> convertToEntityAttribute(String value) {
    return value == null || value.isBlank() ? List.of() : Arrays.stream(value.split(",")).map(Types.Level::valueOf).toList();
  }
}

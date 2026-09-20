package com.thinkerlab.backend.service;

import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class JsonStore {
  private final ObjectMapper mapper;

  public JsonStore(ObjectMapper mapper) {
    this.mapper = mapper;
  }

  public String write(Object value) {
    return mapper.writeValueAsString(value);
  }

  public <T> T read(String value, Class<T> type) {
    return mapper.readValue(value, type);
  }
}

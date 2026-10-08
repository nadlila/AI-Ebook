package com.thinkerlab.backend.service;

import static org.assertj.core.api.Assertions.*;

import com.thinkerlab.backend.api.request.ContentInput;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

class AiContentValidationTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  void missingListContentReportsFieldWithoutLeakingGeneratedText() {
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      var service = new AiService(null, null, null, factory.getValidator());
      var input = mapper.readValue("""
          {"chapters":[{"chapterId":"chapter-1","title":"Private title","blocks":[
            {"id":"list-1","type":"list","items":["Private source excerpt"]}
          ]}]}
          """, ContentInput.class);
      assertThatThrownBy(() -> service.valid(input))
          .isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("chapters[0].blocks[0].content (NotNull)")
          .hasMessageNotContaining("Private");
    }
  }

  @Test
  void listWithEmptyContentAndCitationPassValidation() {
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      var service = new AiService(null, null, null, factory.getValidator());
      var input = mapper.readValue("""
          {"chapters":[{"chapterId":"chapter-1","title":"Example","blocks":[
            {"id":"list-1","type":"list","content":"","items":["Example item"]},
            {"id":"ref-1","type":"citation","content":"Source title",
             "sourceId":"123e4567-e89b-12d3-a456-426614174000","citationLabel":"[1]"}
          ]}]}
          """, ContentInput.class);
      assertThat(service.valid(input)).isSameAs(input);
      assertThatThrownBy(() -> service.valid(null))
          .isInstanceOf(ResponseStatusException.class).hasMessageContaining("Jawaban AI kosong");
    }
  }
}

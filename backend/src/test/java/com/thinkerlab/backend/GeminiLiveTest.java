package com.thinkerlab.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.thinkerlab.backend.api.request.OutlineInput;
import com.thinkerlab.backend.service.GeminiService;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import tools.jackson.databind.ObjectMapper;

/** Explicit opt-in smoke test; never reads credentials from source control. */
@EnabledIfEnvironmentVariable(named = "GEMINI_LIVE_KEY", matches = ".+")
class GeminiLiveTest {
  @Test
  void realModelReturnsValidOutline() {
    var service =
        new GeminiService(System.getenv("GEMINI_LIVE_KEY"), "gemini-3.5-flash", new ObjectMapper());
    var outline =
        service.generate(
            "Create a short Indonesian outline about reading habits, based only on this supplied"
                + " source excerpt: Reading daily can help learners practice recognizing words."
                + " Return JSON"
                + " {\"title\":\"...\",\"learningOutcomes\":[\"...\"],\"chapters\":[{\"id\":\"chapter-1\",\"title\":\"...\",\"lessons\":1}]}."
                + " Use 2 chapters.",
            OutlineInput.class);
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      assertThat(factory.getValidator().validate(outline)).isEmpty();
    }
    assertThat(outline.chapters()).hasSize(2);
  }
}

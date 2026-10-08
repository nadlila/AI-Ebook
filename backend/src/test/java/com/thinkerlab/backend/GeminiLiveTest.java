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
  void realModelReturnsValidContent() {
    var model = System.getenv().getOrDefault("GEMINI_MODEL", "gemini-3.5-flash");
    var service = new GeminiService(System.getenv("GEMINI_LIVE_KEY"), model, new ObjectMapper());
    var content = service.generate(
        "Write one short Indonesian chapter, chapterId chapter-1, about daily reading. "
            + "Use only this source: id 123e4567-e89b-12d3-a456-426614174000, title Reading, "
            + "excerpt: Daily reading provides practice recognizing words. "
            + "Include a list block with items and content as an empty string, and a citation block "
            + "with the exact sourceId and citationLabel [1]. Every block must have id, type and content. "
            + "Use unique block IDs. Keep the chapter under 80 words.",
        com.thinkerlab.backend.api.request.ContentInput.class);
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      assertThat(factory.getValidator().validate(content)).isEmpty();
    }
    assertThat(content.chapters()).hasSize(1);
    assertThat(content.chapters().getFirst().chapterId()).isEqualTo("chapter-1");
    assertThat(content.chapters().getFirst().blocks()).anySatisfy(block -> {
      assertThat(block.type()).isEqualTo(com.thinkerlab.backend.domain.Types.BlockType.list);
      assertThat(block.content()).isNotNull();
      assertThat(block.items()).isNotEmpty();
    });
    assertThat(content.chapters().getFirst().blocks()).anySatisfy(block -> {
      assertThat(block.type()).isEqualTo(com.thinkerlab.backend.domain.Types.BlockType.citation);
      assertThat(block.sourceId()).isEqualTo(java.util.UUID.fromString("123e4567-e89b-12d3-a456-426614174000"));
      assertThat(block.citationLabel()).isEqualTo("[1]");
    });
  }

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

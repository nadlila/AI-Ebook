package com.thinkerlab.backend.service;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

class GroundedResearchParserTest {
  private final ObjectMapper json = new ObjectMapper();

  @Test
  void onlyGroundedUrlsAndAssociatedPassagesBecomeSources() {
    var candidate = json.readTree("""
      {"content":{"parts":[{"text":"Invented https://fake.example/article"}]},
       "groundingMetadata":{
         "groundingChunks":[
           {"web":{"uri":"https://example.org/real","title":"Real reference"}},
           {"web":{"uri":"https://example.org/unsupported","title":"Uncited"}},
           {"web":{"uri":"javascript:alert(1)","title":"Bad"}},
           {"web":{"uri":"not-a-url","title":"Bad"}}],
         "groundingSupports":[
           {"segment":{"text":"A supported explanation."},"groundingChunkIndices":[0]},
           {"segment":{"text":"Invalid source."},"groundingChunkIndices":[2,3,99]}],
         "webSearchQueries":["example research"],
         "searchEntryPoint":{"renderedContent":"<div>Google Search suggestions</div>"}}}
      """);
    var result = GroundedResearchParser.parse(candidate);
    assertThat(result.sources()).hasSize(1);
    assertThat(result.sources().getFirst().url()).isEqualTo("https://example.org/real");
    assertThat(result.sources().getFirst().excerpt()).contains("A supported explanation.", "bukan kutipan verbatim")
        .doesNotContain("Invalid source", "Invented");
    assertThat(result.searchSuggestionsHtml()).contains("Google Search suggestions");
  }

  @Test
  void ungroundedModelAnswerIsRejectedInsteadOfInventingReferences() {
    assertThatThrownBy(() -> GroundedResearchParser.parse(json.readTree("""
      {"content":{"parts":[{"text":"Try https://example.com"}]}}
      """))).isInstanceOf(ResponseStatusException.class);
  }

  @Test
  void duplicateSearchUrlsDoNotBecomeDuplicateSources() {
    var result = GroundedResearchParser.parse(json.readTree("""
      {"groundingMetadata":{
        "groundingChunks":[{"web":{"uri":"https://example.org","title":"One"}},
                           {"web":{"uri":"https://example.org","title":"Two"}}],
        "groundingSupports":[{"segment":{"text":"Shared claim"},"groundingChunkIndices":[0,1]}]}}
      """));
    assertThat(result.sources()).hasSize(1);
  }
}

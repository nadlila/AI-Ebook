package com.thinkerlab.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class GeminiRateLimitTest {
  private final GeminiService service = new GeminiService("test-secret", "test-model", new ObjectMapper());

  @Test
  void rejectionDistinguishesSchemaAuthenticationAndQuotaWithoutExposingProviderText() {
    assertThat(service.providerErrorMessage(400,
        "{\"error\":{\"message\":\"Invalid response_json_schema private project test-secret\"}}", false))
        .contains("400", "schema").doesNotContain("test-secret", "private project");
    assertThat(service.providerErrorMessage(401, "not json", false)).contains("401", "Autentikasi");
    assertThat(service.providerErrorMessage(403, "{}", false)).contains("403", "Akses");
    assertThat(service.providerErrorMessage(429, "{}", false)).contains("429", "kuota");
    assertThat(service.providerErrorMessage(400,
        "{\"error\":{\"message\":\"API key not valid test-secret\"}}", false))
        .contains("API key").doesNotContain("test-secret");
  }

  @Test
  void unspecifiedQuotaDoesNotPromiseWaitingWillFixItOrExposeRawResponse() {
    String message = service.rateLimitMessage("""
        {"error":{"message":"private project test-secret","details":[
        {"@type":"type.googleapis.com/google.rpc.Help"}]}}
        """, true);
    assertThat(message).contains("Google Search", "test-model", "tidak memberikan waktu tunggu")
        .doesNotContain("test-secret", "private project", "Kuota Gemini habis");
  }

  @Test
  void retryAdviceOnlyUsesValidatedProviderDelay() {
    String message = service.rateLimitMessage("""
        {"error":{"details":[{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"12.5s"}]}}
        """, false);
    assertThat(message).contains("12.5s").doesNotContain("Google Search");
    assertThat(service.rateLimitMessage("not json test-secret", false))
        .contains("tidak memberikan waktu tunggu").doesNotContain("test-secret");
  }
}

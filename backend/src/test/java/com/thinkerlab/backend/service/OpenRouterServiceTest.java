package com.thinkerlab.backend.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.net.http.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.ObjectMapper;

class OpenRouterServiceTest {
  record Draft(String title) {}

  @SuppressWarnings("unchecked")
  @Test void sendsAuthenticatedRequestAndReadsJsonDraft() throws Exception {
    var service = spy(new OpenRouterService("test-secret", "test/model:free", new ObjectMapper()));
    var response = (HttpResponse<String>) mock(HttpResponse.class);
    when(response.statusCode()).thenReturn(200);
    when(response.body()).thenReturn(new ObjectMapper().writeValueAsString(java.util.Map.of(
        "choices", java.util.List.of(java.util.Map.of("finish_reason", "stop", "message",
            java.util.Map.of("content", "{\"title\":\"Draft\"}"))))));
    doReturn(response).when(service).send(any());
    assertThat(service.generate("prompt", Draft.class).title()).isEqualTo("Draft");
    var request = ArgumentCaptor.forClass(HttpRequest.class);
    verify(service).send(request.capture());
    assertThat(request.getValue().uri().toString()).isEqualTo("https://openrouter.ai/api/v1/chat/completions");
    assertThat(request.getValue().headers().firstValue("Authorization")).contains("Bearer test-secret");
  }

  @SuppressWarnings("unchecked")
  @Test void rejectsTruncatedDraftAndSanitizesErrors() throws Exception {
    var service = spy(new OpenRouterService("test-secret", "test/model:free", new ObjectMapper()));
    var response = (HttpResponse<String>) mock(HttpResponse.class);
    when(response.headers()).thenReturn(HttpHeaders.of(java.util.Map.of(), (a, b) -> true));
    doReturn(response).when(service).send(any());
    when(response.statusCode()).thenReturn(200);
    when(response.body()).thenReturn("{\"choices\":[{\"finish_reason\":\"length\"}]}");
    assertThatThrownBy(() -> service.generate("prompt", Draft.class)).hasMessageContaining("belum lengkap");
    when(response.statusCode()).thenReturn(429);
    when(response.body()).thenReturn("test-secret private provider error");
    assertThatThrownBy(() -> service.generate("prompt", Draft.class))
        .hasMessageContaining("Batas pemakaian").hasMessageNotContaining("test-secret");
  }

  @SuppressWarnings("unchecked")
  @Test void readsEmbeddedRateLimitAndRetryAfterWithoutRetrying() throws Exception {
    var service = spy(new OpenRouterService("test-secret", "test/model:free", new ObjectMapper()));
    var response = (HttpResponse<String>) mock(HttpResponse.class);
    when(response.statusCode()).thenReturn(200);
    when(response.headers()).thenReturn(HttpHeaders.of(
        java.util.Map.of("Retry-After", java.util.List.of("60")), (a, b) -> true));
    when(response.body()).thenReturn("""
        {"error":{"code":429,"message":"test-secret private error",
          "metadata":{"limit_source":"openrouter_free_tier_daily"}}}
        """);
    doReturn(response).when(service).send(any());
    assertThatThrownBy(() -> service.generate("prompt", Draft.class))
        .hasMessageContaining("Kuota harian").hasMessageContaining("60 detik")
        .hasMessageNotContaining("test-secret").hasMessageNotContaining("private error");
    verify(service, times(1)).send(any());
  }
}

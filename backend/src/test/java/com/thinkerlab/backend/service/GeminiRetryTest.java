package com.thinkerlab.backend.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.net.URI;
import java.net.http.*;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class GeminiRetryTest {
  private final HttpRequest request = HttpRequest.newBuilder(URI.create("https://example.com")).build();
  @SuppressWarnings("unchecked")
  private HttpResponse<String> response(int code) {
    HttpResponse<String> response = mock(HttpResponse.class);
    when(response.statusCode()).thenReturn(code);
    return response;
  }
  private GeminiService service() throws Exception {
    var service = spy(new GeminiService("test-key", "test-model", new ObjectMapper()));
    doNothing().when(service).retryPause(anyLong());
    return service;
  }
  @Test void retriesTransientFailuresThenReturnsSuccess() throws Exception {
    var service = service();
    var success = response(200);
    doReturn(response(503), response(502), success).when(service).sendAttempt(request);
    assertThat(service.sendWithRetry(request)).isSameAs(success);
    verify(service, times(3)).sendAttempt(request);
    var order = inOrder(service);
    order.verify(service).retryPause(2000);
    order.verify(service).retryPause(4000);
  }
  @Test void stopsAfterThreeAttempts() throws Exception {
    var service = service();
    doReturn(response(503)).when(service).sendAttempt(request);
    assertThat(service.sendWithRetry(request).statusCode()).isEqualTo(503);
    verify(service, times(3)).sendAttempt(request);
    verify(service, times(2)).retryPause(anyLong());
  }
  @Test void doesNotRetryAuthenticationValidationOrQuotaErrors() throws Exception {
    for (int status : new int[] {200, 400, 401, 403, 429}) {
      var service = service();
      doReturn(response(status)).when(service).sendAttempt(request);
      assertThat(service.sendWithRetry(request).statusCode()).isEqualTo(status);
      verify(service, times(1)).sendAttempt(request);
      verify(service, never()).retryPause(anyLong());
    }
  }
  @Test void interruptionStopsRetries() throws Exception {
    var service = service();
    doReturn(response(504)).when(service).sendAttempt(request);
    doThrow(new InterruptedException()).when(service).retryPause(anyLong());
    assertThatThrownBy(() -> service.sendWithRetry(request)).isInstanceOf(InterruptedException.class);
    verify(service, times(1)).sendAttempt(request);
  }
}

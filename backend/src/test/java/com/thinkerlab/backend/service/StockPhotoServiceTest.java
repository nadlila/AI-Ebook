package com.thinkerlab.backend.service;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
class StockPhotoServiceTest {
  @Test void missingKeyDoesNotCallProvider() {
    var service = spy(new StockPhotoService("", new ObjectMapper()));
    assertThatThrownBy(() -> service.search("nature", 1)).isInstanceOf(ResponseStatusException.class).hasMessageContaining("UNSPLASH_ACCESS_KEY");
    verify(service, never()).fetch(any(), anyBoolean(), anyInt());
  }
  @Test void searchMapsUnsplashAttributionAndPreservesHotlinkParameters() {
    var service = spy(new StockPhotoService("private-key", new ObjectMapper()));
    String data = """
        {"results":[{"id":"photo_1","urls":{"small":"https://images.unsplash.com/photo-1?w=400&ixid=track","regular":"https://images.unsplash.com/photo-1?w=1080&ixid=track"},"links":{"html":"https://unsplash.com/photos/photo_1"},"user":{"name":"Author","links":{"html":"https://unsplash.com/@author"}},"alt_description":"Nature"}]}
        """;
    doReturn(data.getBytes(StandardCharsets.UTF_8)).when(service).fetch(any(), eq(true), anyInt());
    var results = service.search("science & learning", 2);
    assertThat(results).hasSize(1);
    assertThat(results.getFirst().id()).isEqualTo("photo_1");
    assertThat(results.getFirst().image()).contains("ixid=track");
    assertThat(results.getFirst().photographerUrl()).contains("utm_source=thinkerlab_ebook");
    verify(service).fetch(URI.create("https://api.unsplash.com/search/photos?query=science+%26+learning&orientation=portrait&per_page=12&page=2"), true, 1000000);
  }
  @Test void downloadUsesReturnedTrackingLocationAndRejectsOtherHosts() {
    var service = spy(new StockPhotoService("private-key", new ObjectMapper()));
    doReturn("{\"links\":{\"download_location\":\"https://api.unsplash.com/photos/photo_1/download?ixid=tracking\"}}".getBytes(StandardCharsets.UTF_8))
        .when(service).fetch(any(), eq(true), anyInt());
    service.trackDownload("photo_1");
    verify(service).fetch(URI.create("https://api.unsplash.com/photos/photo_1/download?ixid=tracking"), true, 1000000);
    assertThat(StockPhotoService.safeUrl("https://images.unsplash.com@evil.test/image", "images.unsplash.com")).isFalse();
    assertThatThrownBy(() -> service.trackDownload("../private")).isInstanceOf(ResponseStatusException.class);
    doReturn("{\"links\":{\"download_location\":\"https://evil.test/private\"}}".getBytes(StandardCharsets.UTF_8))
        .when(service).fetch(any(), eq(true), anyInt());
    assertThatThrownBy(() -> service.trackDownload("photo_1")).isInstanceOf(ResponseStatusException.class).hasMessageContaining("pelacakan");
  }
}

package com.thinkerlab.backend.service;

import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.*;

@Service
public class StockPhotoService {
  private final String key;
  private final ObjectMapper mapper;
  private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
  public StockPhotoService(@Value("${app.covers.unsplash-key:}") String key, ObjectMapper mapper) {
    this.key = key.strip(); this.mapper = mapper;
  }
  public record Photo(String id, String preview, String image, String url, String photographer, String photographerUrl, String alt) {}
  byte[] fetch(URI uri, boolean authenticated, int limit) {
    try {
      var request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(25));
      if (authenticated) request.header("Authorization", "Client-ID " + key).header("Accept-Version", "v1");
      var response = client.send(request.GET().build(), HttpResponse.BodyHandlers.ofInputStream());
      try (var stream = response.body()) {
        if (response.statusCode() != 200) {
          if (response.statusCode() == 429) throw ProjectService.error(HttpStatus.TOO_MANY_REQUESTS, "Kuota pencarian Unsplash tercapai. Coba lagi nanti.");
          if (response.statusCode() == 401 || response.statusCode() == 403)
            throw ProjectService.error(HttpStatus.SERVICE_UNAVAILABLE, "Konfigurasi API key Unsplash belum valid.");
          throw ProjectService.error(HttpStatus.BAD_GATEWAY, "Unsplash belum dapat memproses permintaan. Coba lagi.");
        }
        byte[] bytes = stream.readNBytes(limit + 1);
        if (bytes.length > limit) throw ProjectService.error(HttpStatus.BAD_GATEWAY, "Gambar atau respons Unsplash terlalu besar.");
        return bytes;
      }
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw ProjectService.error(HttpStatus.BAD_GATEWAY, "Pencarian gambar dibatalkan.");
    } catch (java.io.IOException e) {
      throw ProjectService.error(HttpStatus.BAD_GATEWAY, "Unsplash tidak dapat dihubungi. Coba lagi.");
    }
  }
  private JsonNode api(String path) {
    if (key.isBlank()) throw ProjectService.error(HttpStatus.SERVICE_UNAVAILABLE,
        "Pencarian gambar belum diaktifkan. Isi UNSPLASH_ACCESS_KEY di backend lalu restart. Upload cover tetap tersedia.");
    try { return mapper.readTree(fetch(URI.create("https://api.unsplash.com/" + path), true, 1000000)); }
    catch (org.springframework.web.server.ResponseStatusException e) { throw e; }
    catch (Exception e) { throw ProjectService.error(HttpStatus.BAD_GATEWAY, "Respons Unsplash tidak dapat dibaca."); }
  }
  public List<Photo> search(String query, int page) {
    var result = api("search/photos?query=" + URLEncoder.encode(query.strip(), StandardCharsets.UTF_8)
        + "&orientation=portrait&per_page=12&page=" + page);
    var photos = new ArrayList<Photo>();
    for (var item : result.path("results")) {
      String preview = item.path("urls").path("small").asText();
      String url = item.path("links").path("html").asText();
      String image = item.path("urls").path("regular").asText();
      String photographerUrl = item.path("user").path("links").path("html").asText();
      if (!safeUrl(preview, "images.unsplash.com") || !safeUrl(image, "images.unsplash.com")
          || !safeUrl(url, "unsplash.com") || !safeUrl(photographerUrl, "unsplash.com")) continue;
      photos.add(new Photo(item.path("id").asText(), preview, image, attribution(url),
          item.path("user").path("name").asText(), attribution(photographerUrl),
          item.path("alt_description").asText("")));
    }
    return photos;
  }
  static boolean safeUrl(String value, String host) {
    try {
      var uri = URI.create(value);
      return "https".equals(uri.getScheme()) && host.equals(uri.getHost())
          && uri.getUserInfo() == null && uri.getPort() == -1;
    } catch (IllegalArgumentException e) { return false; }
  }
  private static String attribution(String url) {
    return url + (url.contains("?") ? "&" : "?") + "utm_source=thinkerlab_ebook&utm_medium=referral";
  }
  public void trackDownload(String photoId) {
    if (!photoId.matches("[A-Za-z0-9_-]{1,100}"))
      throw ProjectService.error(HttpStatus.BAD_REQUEST, "ID foto tidak valid.");
    var photo = api("photos/" + photoId);
    String location = photo.path("links").path("download_location").asText();
    if (!safeUrl(location, "api.unsplash.com")
        || !URI.create(location).getPath().equals("/photos/" + photoId + "/download"))
      throw ProjectService.error(HttpStatus.BAD_GATEWAY, "Alamat pelacakan Unsplash tidak valid.");
    fetch(URI.create(location), true, 1000000);
  }
}

package com.thinkerlab.backend.service;

import com.thinkerlab.backend.api.request.SourceInput;
import com.thinkerlab.backend.api.response.ResearchResult;
import java.net.URI;
import java.util.*;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.JsonNode;

/** Only provider grounding metadata can introduce source URLs, never model prose. */
public final class GroundedResearchParser {
  private GroundedResearchParser() {}

  public static ResearchResult parse(JsonNode candidate) {
    var metadata = candidate.path("groundingMetadata");
    var chunks = metadata.path("groundingChunks");
    Map<String, SourceInput> found = new LinkedHashMap<>();
    for (int index = 0; index < chunks.size() && found.size() < 8; index++) {
      var web = chunks.path(index).path("web");
      String url = web.path("uri").asText("");
      if (!webUrl(url)) continue;
      Set<String> passages = new LinkedHashSet<>();
      for (var support : metadata.path("groundingSupports")) {
        boolean linked = false;
        for (var ref : support.path("groundingChunkIndices")) {
          if (ref.isIntegralNumber() && ref.asInt() == index) linked = true;
        }
        String text = support.path("segment").path("text").asText("").strip();
        if (linked && !text.isBlank()) passages.add(text);
      }
      // An uncited search hit does not provide usable material for the ebook.
      if (passages.isEmpty()) continue;
      String title = web.path("title").asText("").strip();
      if (title.isBlank()) title = URI.create(url).getHost();
      String domain = URI.create(url).getHost();
      String publisher = domain.endsWith("google.com") ? "Sumber web melalui Google Search" : domain;
      String excerpt = "Ringkasan AI berdasarkan sumber web (bukan kutipan verbatim):\n"
          + limit(String.join("\n\n", passages), 5000);
      found.putIfAbsent(url, new SourceInput(limit(title, 200), limit(publisher, 200), url, excerpt));
    }
    if (found.isEmpty()) {
      throw ProjectService.error(HttpStatus.BAD_GATEWAY,
          "Pencarian belum menghasilkan referensi dengan dukungan sumber. Coba lagi atau perjelas topik ebook.");
    }
    List<String> queries = new ArrayList<>();
    for (var query : metadata.path("webSearchQueries")) {
      if (query.isTextual() && !query.asText().isBlank()) queries.add(limit(query.asText(), 500));
      if (queries.size() == 20) break;
    }
    String suggestions = metadata.path("searchEntryPoint").path("renderedContent").asText("");
    if (suggestions.length() > 200000) {
      throw ProjectService.error(HttpStatus.BAD_GATEWAY, "Metadata pencarian terlalu besar. Coba lagi.");
    }
    return new ResearchResult(List.copyOf(found.values()), suggestions, List.copyOf(queries));
  }

  private static boolean webUrl(String value) {
    try {
      var uri = URI.create(value);
      return value.length() <= 2048 && ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))
          && uri.getHost() != null && uri.getUserInfo() == null;
    } catch (IllegalArgumentException ex) { return false; }
  }

  private static String limit(String text, int length) {
    return text.length() <= length ? text : text.substring(0, length);
  }
}

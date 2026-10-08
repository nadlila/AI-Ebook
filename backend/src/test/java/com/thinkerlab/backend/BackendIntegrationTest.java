package com.thinkerlab.backend;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.thinkerlab.backend.domain.*;
import com.thinkerlab.backend.repository.ProfileRepository;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.*;
import tools.jackson.databind.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BackendIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired ProfileRepository profiles;
  @MockitoBean JwtDecoder decoder;
  @MockitoBean com.thinkerlab.backend.service.GeminiService gemini;
  UUID author = UUID.randomUUID(), reader = UUID.randomUUID(), stranger = UUID.randomUUID();

  @Test
  void coverUploadValidatesImageAndOwnershipAndPersistsWithoutChangingWorkflow() throws Exception {
    String id = create().get("id").asText();
    var image = new java.awt.image.BufferedImage(20, 30, java.awt.image.BufferedImage.TYPE_INT_RGB);
    var bytes = new java.io.ByteArrayOutputStream();
    javax.imageio.ImageIO.write(image, "png", bytes);
    var file = new org.springframework.mock.web.MockMultipartFile("file", "cover.png", "image/png", bytes.toByteArray());
    String initialRevision = rev(id);
    mvc.perform(multipart("/api/ebooks/" + id + "/cover").file(file).header("If-Match", initialRevision).with(as(stranger)))
        .andExpect(status().isNotFound());
    mvc.perform(multipart("/api/ebooks/" + id + "/cover").file(file).header("If-Match", initialRevision).with(as(author)))
        .andExpect(status().isOk());
    var saved = call(get("/api/ebooks/" + id), author, 200);
    String cover = saved.get("coverImage").asText();
    assertThat(cover).startsWith("data:image/jpeg;base64,");
    assertThat(saved.get("status").asText()).isEqualTo("DRAFT");
    mvc.perform(multipart("/api/ebooks/" + id + "/cover").file(file).header("If-Match", initialRevision).with(as(author)))
        .andExpect(status().isConflict());
    var fake = new org.springframework.mock.web.MockMultipartFile("file", "fake.png", "image/png", "<svg>fake</svg>".getBytes());
    mvc.perform(multipart("/api/ebooks/" + id + "/cover").file(fake).header("If-Match", rev(id)).with(as(author)))
        .andExpect(status().isBadRequest());
    var metadata = (tools.jackson.databind.node.ObjectNode) json.readTree(INPUT);
    metadata.put("coverImage", cover);
    call(put("/api/ebooks/" + id).header("If-Match", rev(id)).contentType("application/json").content(body(metadata)), author, 200);
    assertThat(call(get("/api/ebooks/" + id), author, 200).get("coverImage").asText()).isEqualTo(cover);
  }

  @BeforeEach
  void authors() {
    for (var id : List.of(author, stranger)) {
      var p = new Profile();
      p.id = id;
      p.role = Types.Role.AUTHOR;
      profiles.save(p);
    }
  }

  org.springframework.test.web.servlet.request.RequestPostProcessor as(UUID id) {
    return jwt().jwt(j -> j.subject(id.toString()));
  }

  JsonNode call(
      org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
      UUID actor,
      int status)
      throws Exception {
    var body =
        mvc.perform(request.with(as(actor)))
            .andExpect(status().is(status))
            .andReturn()
            .getResponse()
            .getContentAsString();
    return body.isBlank() ? json.createObjectNode() : json.readTree(body);
  }

  String body(Object value) {
    return json.writeValueAsString(value);
  }

  static final String INPUT =
      """
{"type":"EBOOK","title":"Belajar UX","description":"Contoh","learningGoal":"Memahami riset","audience":"Pemula","targetLevel":"Beginner","language":"Indonesia","writingStyle":"Friendly","contentLength":"Short"}
""";

  JsonNode create() throws Exception {
    return call(post("/api/ebooks").contentType("application/json").content(INPUT), author, 201);
  }

  String rev(String id) throws Exception {
    return call(get("/api/ebooks/" + id), author, 200).get("revision").asText();
  }

  org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder mutate(
      String id, String suffix, String payload) throws Exception {
    return post("/api/ebooks/" + id + suffix)
        .header("If-Match", rev(id))
        .contentType("application/json")
        .content(payload);
  }

  String source(String id) throws Exception {
    return call(
            mutate(
                id,
                "/sources",
                body(
                    Map.of(
                        "title",
                        "Sumber",
                        "publisher",
                        "Penerbit",
                        "url",
                        "https://example.org/article",
                        "excerpt",
                        "Catatan sumber dari author."))),
            author,
            201)
        .get("id")
        .asText();
  }

  void outline(String id) throws Exception {
    var o =
        call(
            mutate(
                id,
                "/outlines",
                """
{"title":"Belajar UX","learningOutcomes":["Memahami riset"],"chapters":[{"id":"chapter-1","title":"Dasar","lessons":1}]}
"""),
            author,
            201);
    call(mutate(id, "/outlines/" + o.get("id").asText() + "/approve", ""), author, 200);
  }

  String content(String id, String source, String text) throws Exception {
    var block = new LinkedHashMap<String, Object>();
    block.put("id", "block-1");
    block.put("type", "paragraph");
    block.put("content", text);
    if (source != null) block.put("sourceId", source);
    var payload =
        Map.of(
            "chapters",
            List.of(Map.of("chapterId", "chapter-1", "title", "Dasar", "blocks", List.of(block))));
    return call(
            put("/api/ebooks/" + id + "/content")
                .header("If-Match", rev(id))
                .contentType("application/json")
                .content(body(payload)),
            author,
            200)
        .get("id")
        .asText();
  }

  String publish(String id, String version) throws Exception {
    call(mutate(id, "/quality-check", ""), author, 200);
    call(
        mutate(
            id,
            "/approve",
            body(Map.of("contentVersionId", version, "humanReviewConfirmed", true))),
        author,
        200);
    return call(mutate(id, "/publish", ""), author, 200).get("id").asText();
  }

  @Test
  void unauthenticatedRejectedAndHealthPublic() throws Exception {
    mvc.perform(get("/api/ebooks")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/health")).andExpect(status().isOk());
  }

  @Test
  void readerCannotCreateAndCannotPromoteSelf() throws Exception {
    call(post("/api/ebooks").contentType("application/json").content(INPUT), reader, 403);
    assertThat(call(get("/api/auth/me"), reader, 200).get("role").asText()).isEqualTo("READER");
    call(
        post("/api/ebooks")
            .contentType("application/json")
            .content(INPUT.replace("\"EBOOK\"", "\"EBOOK\",\"ownerId\":\"" + stranger + "\"")),
        author,
        400);
  }

  @Test
  void crossOwnerAccessReturns404() throws Exception {
    String id = create().get("id").asText();
    for (String suffix : List.of("", "/sources", "/outlines", "/versions", "/audit"))
      call(get("/api/ebooks/" + id + suffix), stranger, 404);
    call(post("/api/ebooks/" + id + "/publish").header("If-Match", "0"), stranger, 404);
    assertThat(call(get("/api/ebooks"), stranger, 200).path("items").size()).isZero();
  }

  @Test
  void staleRevisionCannotOverwrite() throws Exception {
    String id = create().get("id").asText(), old = rev(id);
    source(id);
    call(
        put("/api/ebooks/" + id)
            .header("If-Match", old)
            .contentType("application/json")
            .content(INPUT),
        author,
        409);
    call(put("/api/ebooks/" + id).contentType("application/json").content(INPUT), author, 400);
  }

  @Test
  void approvalAndPublicationGates() throws Exception {
    String id = create().get("id").asText();
    call(mutate(id, "/publish", ""), author, 409);
    call(
        put("/api/ebooks/" + id + "/content")
            .header("If-Match", rev(id))
            .contentType("application/json")
            .content(
                "{\"chapters\":[{\"chapterId\":\"chapter-1\",\"title\":\"T\",\"blocks\":[{\"id\":\"b\",\"type\":\"paragraph\",\"content\":\"text\"}]}]}"),
        author,
        409);
    source(id);
    outline(id);
    String v = content(id, null, "Tanpa sumber");
    assertThat(call(mutate(id, "/quality-check", ""), author, 200).get("passed").asBoolean())
        .isFalse();
    call(
        mutate(id, "/approve", body(Map.of("contentVersionId", v, "humanReviewConfirmed", true))),
        author,
        409);
  }

  @Test
  void fullFlowImmutableVersionsIdempotentPublishAndUnpublish() throws Exception {
    String id = create().get("id").asText(), s = source(id);
    outline(id);
    String v = content(id, s, "Konten versi pertama");
    String pub = publish(id, v);
    assertThat(call(mutate(id, "/publish", ""), author, 200).get("id").asText()).isEqualTo(pub);
    var response = call(get("/api/library/" + pub), author, 200);
    assertThat(response.toString())
        .contains("Konten versi pertama")
        .doesNotContain("Catatan sumber dari author.");
    call(
        put("/api/library/" + pub + "/progress")
            .contentType("application/json")
            .content(body(Map.of("contentVersionId", v, "chapterIndex", 0, "completion", 70))),
        author,
        200);
    assertThat(
            call(get("/api/library/" + pub + "/progress"), author, 200).get("completion").asInt())
        .isEqualTo(70);
    for (var other : List.of(reader, stranger)) {
      call(get("/api/library/" + pub), other, 404);
      call(get("/api/library/" + pub + "/progress"), other, 404);
      call(get("/api/ebooks/" + id + "/publication"), other, other.equals(reader) ? 403 : 404);
      call(put("/api/library/" + pub + "/progress").contentType("application/json")
          .content(body(Map.of("contentVersionId", v, "chapterIndex", 0, "completion", 50))), other, 404);
      call(post("/api/library/" + pub + "/issues").contentType("application/json")
          .content(body(Map.of("message", "Private test"))), other, 404);
      assertThat(call(get("/api/library?search=Belajar UX"), other, 200).path("items").size()).isZero();
    }
    assertThat(call(get("/api/ebooks/" + id + "/publication"), author, 200).get("id").asText()).isEqualTo(pub);
    assertThat(call(get("/api/library?search=Belajar UX"), author, 200).path("items").size()).isEqualTo(1);
    call(mutate(id, "/unpublish", ""), author, 200);
    call(get("/api/library/" + pub), author, 404);
    String v2 = content(id, s, "Konten versi kedua");
    assertThat(v2).isNotEqualTo(v);
    assertThat(call(get("/api/ebooks/" + id + "/versions"), author, 200).size()).isEqualTo(2);
    call(mutate(id, "/publish", ""), author, 409);
    assertThat(publish(id, v2)).isEqualTo(pub);
    assertThat(
            call(get("/api/library/" + pub + "/progress"), author, 200).get("completion").asInt())
        .isZero();
  }

  @Test
  void citationsCannotReferenceAnotherProject() throws Exception {
    String a = create().get("id").asText(), foreign = source(a), b = create().get("id").asText();
    source(b);
    outline(b);
    var input =
        Map.of(
            "chapters",
            List.of(
                Map.of(
                    "chapterId",
                    "chapter-1",
                    "title",
                    "T",
                    "blocks",
                    List.of(
                        Map.of(
                            "id",
                            "b",
                            "type",
                            "paragraph",
                            "content",
                            "x",
                            "sourceId",
                            foreign)))));
    call(
        put("/api/ebooks/" + b + "/content")
            .header("If-Match", rev(b))
            .contentType("application/json")
            .content(body(input)),
        author,
        400);
  }

  @Test
  void lockedSourcesCannotBeRemoved() throws Exception {
    String id = create().get("id").asText(), s = source(id);
    call(
        patch("/api/ebooks/" + id + "/sources/" + s)
            .header("If-Match", rev(id))
            .contentType("application/json")
            .content("{\"selected\":true,\"locked\":true}"),
        author,
        200);
    call(delete("/api/ebooks/" + id + "/sources/" + s).header("If-Match", rev(id)), author, 409);
  }

  @Test
  void manualApprovalRequiredAndInvalidProgressRejected() throws Exception {
    String id = create().get("id").asText(), s = source(id);
    outline(id);
    String v = content(id, s, "Valid");
    call(mutate(id, "/quality-check", ""), author, 200);
    call(
        mutate(id, "/approve", body(Map.of("contentVersionId", v, "humanReviewConfirmed", false))),
        author,
        400);
    String pub = publish(id, v);
    call(
        put("/api/library/" + pub + "/progress")
            .contentType("application/json")
            .content(body(Map.of("contentVersionId", v, "chapterIndex", 4, "completion", 70))),
        author,
        400);
    call(
        put("/api/library/" + pub + "/progress")
            .contentType("application/json")
            .content(body(Map.of("contentVersionId", v, "chapterIndex", 0, "completion", 101))),
        author,
        400);
  }

  @Test
  void restoreCreatesNewVersionWithoutDeletingHistory() throws Exception {
    String id = create().get("id").asText(), s = source(id);
    outline(id);
    String v = content(id, s, "Original");
    content(id, s, "Edited");
    var restored = call(mutate(id, "/versions/" + v + "/restore", ""), author, 200);
    assertThat(restored.get("id").asText()).isNotEqualTo(v);
    assertThat(restored.toString()).contains("Original");
    assertThat(call(get("/api/ebooks/" + id + "/versions"), author, 200).size()).isEqualTo(3);
  }

  @Test
  void corsAllowsOnlyConfiguredFrontend() throws Exception {
    mvc.perform(
            options("/api/ebooks")
                .header("Origin", "http://localhost:4200")
                .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));
    mvc.perform(
            options("/api/ebooks")
                .header("Origin", "https://evil.example")
                .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isForbidden());
  }

  @Test
  void aiRequiresOwnershipSourcesAndApproval() throws Exception {
    String id = create().get("id").asText();
    call(mutate(id, "/ai/outline", ""), reader, 403);
    call(mutate(id, "/ai/outline", ""), stranger, 404);
    call(mutate(id, "/ai/outline", ""), author, 409);
    source(id);
    call(mutate(id, "/ai/content", ""), author, 409);
    org.mockito.Mockito.verifyNoInteractions(gemini);
  }

  @Test
  void aiOutlineAndContentPersistAndRepeatedGenerationDoesNotOverwrite() throws Exception {
    String id = create().get("id").asText();
    String sid = source(id);
    var outline =
        new com.thinkerlab.backend.api.request.OutlineInput(
            "Test",
            List.of("Understand"),
            List.of(new com.thinkerlab.backend.api.model.Chapter("chapter-1", "Basics", 1)));
    org.mockito.Mockito.when(
            gemini.generate(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(
                    com.thinkerlab.backend.api.request.OutlineInput.class)))
        .thenReturn(outline);
    var o = call(mutate(id, "/ai/outline", ""), author, 200);
    call(mutate(id, "/outlines/" + o.get("id").asText() + "/approve", ""), author, 200);
    var content =
        new com.thinkerlab.backend.api.request.ContentInput(
            List.of(
                new com.thinkerlab.backend.api.model.ChapterContent(
                    "chapter-1",
                    "Basics",
                    List.of(
                        new com.thinkerlab.backend.api.model.Block(
                            "b1",
                            Types.BlockType.paragraph,
                            "Supported text",
                            null,
                            UUID.fromString(sid),
                            "[1]")))));
    org.mockito.Mockito.when(
            gemini.generate(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(
                    com.thinkerlab.backend.api.request.ContentInput.class)))
        .thenReturn(content);
    var first = call(mutate(id, "/ai/content", ""), author, 200);
    var again = call(mutate(id, "/ai/content", ""), author, 200);
    assertThat(again.get("id")).isEqualTo(first.get("id"));
    assertThat(
            call(get("/api/ebooks/" + id + "/content"), author, 200)
                .path("content")
                .path("chapters")
                .size())
        .isEqualTo(1);
    org.mockito.Mockito.verify(gemini, org.mockito.Mockito.times(1))
        .generate(
            org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.eq(com.thinkerlab.backend.api.request.ContentInput.class));
  }

  @Test
  void invalidAiContentDoesNotCreateVersion() throws Exception {
    String id = create().get("id").asText();
    source(id);
    outline(id);
    var invalid =
        new com.thinkerlab.backend.api.request.ContentInput(
            List.of(
                new com.thinkerlab.backend.api.model.ChapterContent(
                    "wrong-chapter",
                    "Invalid",
                    List.of(
                        new com.thinkerlab.backend.api.model.Block(
                            "b", Types.BlockType.paragraph, "text", null, null, null)))));
    org.mockito.Mockito.when(
            gemini.generate(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(
                    com.thinkerlab.backend.api.request.ContentInput.class)))
        .thenReturn(invalid);
    call(mutate(id, "/ai/content", ""), author, 400);
    assertThat(call(get("/api/ebooks/" + id), author, 200).get("currentVersionId").isNull())
        .isTrue();
  }

  @Test
  void researchIsPrivatePersistentAndCachedUntilExplicitRefresh() throws Exception {
    String id = create().get("id").asText();
    var result = new com.thinkerlab.backend.api.response.ResearchResult(
        List.of(new com.thinkerlab.backend.api.request.SourceInput("Grounded source", "example.org",
            "https://example.org/research", "Ringkasan AI berdasarkan sumber web: Supported material")),
        "<div>Search suggestions</div>", List.of("research topic"));
    org.mockito.Mockito.when(gemini.research(org.mockito.ArgumentMatchers.anyString())).thenReturn(result);
    call(get("/api/ebooks/" + id + "/ai/research"), stranger, 404);
    call(mutate(id, "/ai/research", ""), stranger, 404);
    call(mutate(id, "/ai/research", ""), reader, 403);
    var found = call(mutate(id, "/ai/research", ""), author, 200);
    assertThat(found.path("sources").size()).isEqualTo(1);
    assertThat(found.path("sources").get(0).path("selected").asBoolean()).isFalse();
    assertThat(found.path("searchSuggestionsHtml").asText()).contains("Search suggestions");
    assertThat(call(get("/api/ebooks/" + id + "/ai/research"), author, 200).path("hasResearch").asBoolean()).isTrue();
    call(mutate(id, "/ai/research", ""), author, 200);
    org.mockito.Mockito.verify(gemini, org.mockito.Mockito.times(1)).research(org.mockito.ArgumentMatchers.anyString());
    call(mutate(id, "/ai/research?refresh=true", ""), author, 200);
    assertThat(call(get("/api/ebooks/" + id + "/sources"), author, 200).size()).isEqualTo(1);
    var sid = found.path("sources").get(0).path("id").asText();
    call(patch("/api/ebooks/" + id + "/sources/" + sid).header("If-Match", rev(id))
        .contentType("application/json").content("{\"selected\":true,\"locked\":false}"), author, 200);
    outline(id);
    call(mutate(id, "/ai/research?refresh=true", ""), author, 409);
    org.mockito.Mockito.verify(gemini, org.mockito.Mockito.times(2)).research(org.mockito.ArgumentMatchers.anyString());
  }

  @Test
  void failedResearchDoesNotCreateFakeSources() throws Exception {
    String id = create().get("id").asText();
    org.mockito.Mockito.when(gemini.research(org.mockito.ArgumentMatchers.anyString()))
        .thenThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.BAD_GATEWAY, "No grounded results"));
    call(mutate(id, "/ai/research", ""), author, 502);
    assertThat(call(get("/api/ebooks/" + id + "/sources"), author, 200).size()).isZero();
    assertThat(call(get("/api/ebooks/" + id + "/ai/research"), author, 200).path("hasResearch").asBoolean()).isFalse();
  }
}

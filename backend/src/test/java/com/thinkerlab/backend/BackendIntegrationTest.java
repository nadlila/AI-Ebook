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
  void deleteDraftChecksOwnershipAndRevision() throws Exception {
    String id = create().get("id").asText();
    String oldRevision = rev(id);
    source(id);
    mvc.perform(delete("/api/ebooks/" + id).header("If-Match", rev(id)).with(as(stranger)))
        .andExpect(status().isNotFound());
    mvc.perform(delete("/api/ebooks/" + id).header("If-Match", oldRevision).with(as(author)))
        .andExpect(status().isConflict());
    mvc.perform(delete("/api/ebooks/" + id).header("If-Match", rev(id)).with(as(author)))
        .andExpect(status().isNoContent());
    call(get("/api/ebooks/" + id), author, 404);
  }

  @Test
  void deletePublishedEbookRemovesContentAndReaderData() throws Exception {
    String id = create().get("id").asText(), s = source(id);
    outline(id);
    String version = content(id, s, "Konten untuk dihapus");
    String publication = publish(id, version);
    call(put("/api/library/" + publication + "/progress").contentType("application/json")
        .content(body(Map.of("contentVersionId", version, "chapterIndex", 0, "completion", 70))), author, 200);
    call(post("/api/library/" + publication + "/issues").contentType("application/json")
        .content(body(Map.of("message", "Periksa konten"))), author, 200);
    mvc.perform(delete("/api/ebooks/" + id).header("If-Match", rev(id)).with(as(author)))
        .andExpect(status().isNoContent());
    call(get("/api/ebooks/" + id), author, 404);
    call(get("/api/library/" + publication), author, 404);
    call(get("/api/library/" + publication + "/progress"), author, 404);
  }

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

  @Test
  void pdfUploadExtractsEveryPageAndChecksOwnershipAndRevision() throws Exception {
    String id = create().get("id").asText();
    byte[] bytes;
    try (var document = new org.apache.pdfbox.pdmodel.PDDocument();
        var output = new java.io.ByteArrayOutputStream()) {
      for (String text : List.of("First page evidence", "Second page evidence")) {
        var page = new org.apache.pdfbox.pdmodel.PDPage();
        document.addPage(page);
        try (var content = new org.apache.pdfbox.pdmodel.PDPageContentStream(document, page)) {
          content.beginText();
          content.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(
              org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA), 12);
          content.showText(text);
          content.endText();
        }
      }
      document.save(output);
      bytes = output.toByteArray();
    }
    var file = new org.springframework.mock.web.MockMultipartFile("file", "journal.pdf", "application/pdf", bytes);
    String revision = rev(id);
    mvc.perform(multipart("/api/ebooks/" + id + "/sources/pdf").file(file)
        .param("title", "Journal").param("publisher", "Author").header("If-Match", revision).with(as(stranger)))
        .andExpect(status().isNotFound());
    mvc.perform(multipart("/api/ebooks/" + id + "/sources/pdf").file(file)
        .param("title", "Journal").param("publisher", "Author").header("If-Match", revision).with(as(author)))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.pageCount").value(2))
        .andExpect(jsonPath("$.fileName").value("journal.pdf"));
    var source = call(get("/api/ebooks/" + id + "/sources"), author, 200).get(0);
    assertThat(source.get("excerpt").asText()).contains("[Halaman 1]", "First page evidence", "[Halaman 2]", "Second page evidence");
    mvc.perform(multipart("/api/ebooks/" + id + "/sources/pdf").file(file)
        .param("title", "Journal").param("publisher", "Author").header("If-Match", revision).with(as(author)))
        .andExpect(status().isConflict());
    var fake = new org.springframework.mock.web.MockMultipartFile("file", "fake.pdf", "application/pdf", "fake".getBytes());
    mvc.perform(multipart("/api/ebooks/" + id + "/sources/pdf").file(fake)
        .param("title", "Journal").param("publisher", "Author").header("If-Match", rev(id)).with(as(author)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void multipleLearningLevelsPersistAndEmptySelectionsAreRejected() throws Exception {
    var input = (tools.jackson.databind.node.ObjectNode) json.readTree(INPUT);
    input.putArray("targetLevels").add("Advanced").add("Beginner").add("Intermediate");
    var created = call(post("/api/ebooks").contentType("application/json").content(body(input)), author, 201);
    var loaded = call(get("/api/ebooks/" + created.path("id").asText()), author, 200);
    assertThat(loaded.path("targetLevels").size()).isEqualTo(3);
    assertThat(loaded.path("targetLevels").get(0).asText()).isEqualTo("Beginner");
    assertThat(loaded.path("targetLevels").get(2).asText()).isEqualTo("Advanced");
    input.putArray("targetLevels");
    call(post("/api/ebooks").contentType("application/json").content(body(input)), author, 400);
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
    assertThat(o.path("outline").path("candidates").asBoolean()).isTrue();
    call(mutate(id, "/outlines/" + o.get("id").asText() + "/approve", ""), author, 409);
    o = call(mutate(id, "/ai/outline/finalize", "{\"chapterIds\":[\"chapter-1\"]}"), author, 200);
    assertThat(o.path("outline").path("candidates").asBoolean()).isFalse();
    assertThat(o.path("outline").path("chapters").get(0).path("estimatedWords").asInt()).isEqualTo(2000);
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
    org.mockito.Mockito.verify(gemini, org.mockito.Mockito.times(2))
        .generate(
            org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.eq(com.thinkerlab.backend.api.request.ContentInput.class));
  }

  @Test
  void mediumSelectionPreservesTargetOrderAndCanRestorePreviouslyRemovedCandidates() throws Exception {
    String id = call(post("/api/ebooks").contentType("application/json")
        .content(INPUT.replace("Short", "Medium")), author, 201).get("id").asText();
    source(id);
    var a = new com.thinkerlab.backend.api.model.Chapter("a", "Basics", 1);
    var b = new com.thinkerlab.backend.api.model.Chapter("b", "Methods", 2);
    var c = new com.thinkerlab.backend.api.model.Chapter("c", "Practice", 3);
    var all = new com.thinkerlab.backend.api.request.OutlineInput("Book", List.of("Learn"), List.of(a,b,c));
    var chosen = new com.thinkerlab.backend.api.request.OutlineInput("Book", List.of("Learn"), List.of(c,a));
    org.mockito.Mockito.when(gemini.generate(org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.eq(com.thinkerlab.backend.api.request.OutlineInput.class))).thenReturn(all, chosen, all);
    call(mutate(id, "/ai/outline", ""), author, 200);
    call(mutate(id, "/ai/outline/finalize", "{\"chapterIds\":[]}"), author, 400);
    call(mutate(id, "/ai/outline/finalize", "{\"chapterIds\":[\"a\",\"a\"]}"), author, 400);
    call(mutate(id, "/ai/outline/finalize", "{\"chapterIds\":[\"unknown\"]}"), author, 400);
    var finalOutline = call(mutate(id, "/ai/outline/finalize", "{\"chapterIds\":[\"c\",\"a\"]}"), author, 200).path("outline");
    assertThat(finalOutline.path("chapters").get(0).path("id").asText()).isEqualTo("c");
    assertThat(finalOutline.path("chapters").get(0).path("estimatedWords").asInt()).isEqualTo(3000);
    assertThat(finalOutline.path("chapters").get(1).path("estimatedWords").asInt()).isEqualTo(1000);
    var restored = call(mutate(id, "/ai/outline/finalize", "{\"chapterIds\":[\"a\",\"b\",\"c\"]}"), author, 200).path("outline");
    assertThat(restored.path("chapters").size()).isEqualTo(3);
    int total = 0;
    for (var chapter : restored.path("chapters")) total += chapter.path("estimatedWords").asInt();
    assertThat(total).isEqualTo(4000);
  }

  @Test
  void generationUsesPerChapterBudgetsAndUniqueBlockIdsAndReportsActualWords() throws Exception {
    String id = create().get("id").asText();
    source(id);
    var outline = new com.thinkerlab.backend.api.request.OutlineInput("Book", List.of("Learn"), List.of(
        new com.thinkerlab.backend.api.model.Chapter("a", "A", 1),
        new com.thinkerlab.backend.api.model.Chapter("b", "B", 1)));
    var saved = call(mutate(id, "/outlines", body(outline)), author, 201);
    call(mutate(id, "/outlines/" + saved.path("id").asText() + "/approve", ""), author, 200);
    var first = new com.thinkerlab.backend.api.request.ContentInput(List.of(
        new com.thinkerlab.backend.api.model.ChapterContent("a", "A", List.of(
          new com.thinkerlab.backend.api.model.Block("same-id", Types.BlockType.paragraph,
            "evidence ".repeat(1000), null, null, null)))));
    var second = new com.thinkerlab.backend.api.request.ContentInput(List.of(
        new com.thinkerlab.backend.api.model.ChapterContent("b", "B", List.of(
          new com.thinkerlab.backend.api.model.Block("same-id", Types.BlockType.paragraph,
            "example ".repeat(1000), null, null, null)))));
    org.mockito.Mockito.when(gemini.generate(org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.eq(com.thinkerlab.backend.api.request.ContentInput.class))).thenReturn(first, second);
    var result = call(mutate(id, "/ai/content", ""), author, 200);
    assertThat(result.path("wordCount").path("actual").asInt()).isEqualTo(2000);
    assertThat(result.path("wordCount").path("withinRange").asBoolean()).isTrue();
    var chapters = result.path("content").path("chapters");
    assertThat(chapters.get(0).path("chapterId").asText()).isEqualTo("a");
    assertThat(chapters.get(1).path("chapterId").asText()).isEqualTo("b");
    assertThat(chapters.get(0).path("blocks").get(0).path("id").asText())
      .isNotEqualTo(chapters.get(1).path("blocks").get(0).path("id").asText());
    var prompts = org.mockito.ArgumentCaptor.forClass(String.class);
    org.mockito.Mockito.verify(gemini, org.mockito.Mockito.times(2)).generate(prompts.capture(),
        org.mockito.ArgumentMatchers.eq(com.thinkerlab.backend.api.request.ContentInput.class));
    assertThat(prompts.getAllValues().get(0)).contains("Write ONLY chapter a", "Target 1000 words");
    assertThat(prompts.getAllValues().get(1)).contains("Write ONLY chapter b", "Target 1000 words");
  }

  @Test
  void workflowPersistsDraftsPerStageAndRejectsOtherOwnersAndStaleRevisions() throws Exception {
    String id = create().path("id").asText();
    String revision = rev(id);
    String payload = "{\"step\":\"LEARNING_PREFERENCES\",\"draft\":\"{\\\"language\\\":\\\"Indonesian\\\"}\"}";
    call(put("/api/ebooks/" + id + "/workflow").header("If-Match", revision)
        .contentType("application/json").content(payload), stranger, 404);
    call(put("/api/ebooks/" + id + "/workflow").header("If-Match", revision)
        .contentType("application/json").content(payload), author, 200);
    call(put("/api/ebooks/" + id + "/workflow").header("If-Match", revision)
        .contentType("application/json").content(payload), author, 409);
    var stored = call(get("/api/ebooks/" + id), author, 200);
    assertThat(stored.path("workflowStep").asText()).isEqualTo("LEARNING_PREFERENCES");
    assertThat(stored.path("workflowDrafts").asText()).contains("Indonesian");
    call(put("/api/ebooks/" + id + "/workflow").header("If-Match", rev(id))
        .contentType("application/json").content("{\"step\":\"INVALID\"}"), author, 400);
  }

  @Test
  void failedGenerationResumesFromLastPersistedChapter() throws Exception {
    String id = create().path("id").asText();
    source(id);
    var outline = new com.thinkerlab.backend.api.request.OutlineInput("Book", List.of("Learn"), List.of(
        new com.thinkerlab.backend.api.model.Chapter("a", "A", 1),
        new com.thinkerlab.backend.api.model.Chapter("b", "B", 1)));
    var saved = call(mutate(id, "/outlines", body(outline)), author, 201);
    call(mutate(id, "/outlines/" + saved.path("id").asText() + "/approve", ""), author, 200);
    var first = new com.thinkerlab.backend.api.request.ContentInput(List.of(
        new com.thinkerlab.backend.api.model.ChapterContent("a", "A", List.of(
          new com.thinkerlab.backend.api.model.Block("id", Types.BlockType.paragraph,
            "evidence ".repeat(1000), null, null, null)))));
    var second = new com.thinkerlab.backend.api.request.ContentInput(List.of(
        new com.thinkerlab.backend.api.model.ChapterContent("b", "B", List.of(
          new com.thinkerlab.backend.api.model.Block("id", Types.BlockType.paragraph,
            "example ".repeat(1000), null, null, null)))));
    org.mockito.Mockito.when(gemini.generate(org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.eq(com.thinkerlab.backend.api.request.ContentInput.class)))
        .thenReturn(first).thenThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.BAD_GATEWAY, "Temporary failure")).thenReturn(second);
    call(mutate(id, "/ai/content", ""), author, 502);
    var interrupted = call(get("/api/ebooks/" + id), author, 200);
    assertThat(interrupted.path("currentVersionId").isNull()).isTrue();
    assertThat(interrupted.path("workflowStep").asText()).isEqualTo("GENERATION");
    var drafts = json.readTree(interrupted.path("workflowDrafts").asText());
    assertThat(json.readTree(drafts.path("GENERATION").asText()).path("chapters").size()).isEqualTo(1);
    var complete = call(mutate(id, "/ai/content", ""), author, 200);
    assertThat(complete.path("content").path("chapters").size()).isEqualTo(2);
    var prompts = org.mockito.ArgumentCaptor.forClass(String.class);
    org.mockito.Mockito.verify(gemini, org.mockito.Mockito.times(3)).generate(prompts.capture(),
        org.mockito.ArgumentMatchers.eq(com.thinkerlab.backend.api.request.ContentInput.class));
    assertThat(prompts.getAllValues().get(2)).contains("Write ONLY chapter b");
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
    call(mutate(id, "/ai/content", ""), author, 502);
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

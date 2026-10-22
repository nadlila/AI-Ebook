package com.thinkerlab.backend.service;
import static org.assertj.core.api.Assertions.*;
import com.thinkerlab.backend.api.model.*;
import com.thinkerlab.backend.api.request.*;
import com.thinkerlab.backend.domain.Types.*;
import java.util.*;
import org.junit.jupiter.api.Test;
class WordBudgetTest {
  @Test void removingChaptersRedistributesTheWholeTargetAndPreservesOrder() {
    var a = new Chapter("a", "A", 1);
    var b = new Chapter("b", "B", 3);
    var outline = new OutlineInput("Book", List.of("Learn"), List.of(a, b));
    var allocated = WordBudget.allocate(Length.Medium, outline);
    assertThat(allocated.chapters()).extracting(Chapter::estimatedWords).containsExactly(1000, 3000);
    var subset = WordBudget.allocate(Length.Medium, new OutlineInput("Book", List.of("Learn"), List.of(b)));
    assertThat(subset.chapters().getFirst().estimatedWords()).isEqualTo(4000);
    assertThat(subset.chapters().getFirst().id()).isEqualTo("b");
  }
  @Test void roundedAllocationsAlwaysSumToTarget() {
    for (var length : Length.values()) {
      var outline = new OutlineInput("Book", List.of("Learn"), List.of(
          new Chapter("a", "A", 1), new Chapter("b", "B", 1), new Chapter("c", "C", 1)));
      assertThat(WordBudget.allocate(length, outline).chapters().stream().mapToInt(Chapter::estimatedWords).sum())
          .isEqualTo(WordBudget.target(length));
    }
  }
  @Test void actualWordsIncludeListsAndUnicodeButExcludeCitationLabels() {
    var chapter = new ChapterContent("a", "Title not counted", List.of(
        new Block("p", BlockType.paragraph, "Belajar metode ilmiah.", null, null, null),
        new Block("l", BlockType.list, "Contoh", List.of("Satu dua", "Tiga"), null, null),
        new Block("c", BlockType.citation, "Reference title excluded", null, null, null)));
    assertThat(WordBudget.words(chapter)).isEqualTo(7);
    assertThat(WordBudget.words("caf\u00e9 data-driven")).isEqualTo(2);
    var report = WordBudget.report(Length.Medium, new ContentInput(List.of(chapter)));
    assertThat(report.get("actual")).isEqualTo(7);
    assertThat(report.get("withinRange")).isEqualTo(false);
  }
}

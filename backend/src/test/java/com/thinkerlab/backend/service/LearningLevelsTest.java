package com.thinkerlab.backend.service;
import static org.assertj.core.api.Assertions.*;
import com.thinkerlab.backend.domain.*;
import com.thinkerlab.backend.api.model.*;
import com.thinkerlab.backend.api.request.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
class LearningLevelsTest {
  private final Project project = new Project();
  private OutlineInput outline(Chapter... chapters) { return new OutlineInput("Book", List.of("Learn"), List.of(chapters)); }
  private Chapter chapter(String id, Types.Level level) { return new Chapter(id, id, 1, "Scope", 0, level); }
  @Test void allLevelsArePreservedThroughWordAllocationWithTheSameTotal() {
    project.targetLevels = List.of(Types.Level.Advanced, Types.Level.Beginner, Types.Level.Intermediate);
    var result = LearningLevels.normalize(project, outline(chapter("a", Types.Level.Beginner),
        chapter("b", Types.Level.Intermediate), chapter("c", Types.Level.Advanced)), HttpStatus.BAD_REQUEST);
    var budget = WordBudget.allocate(Types.Length.Medium, result);
    assertThat(budget.chapters()).extracting(Chapter::level).containsExactly(Types.Level.Beginner, Types.Level.Intermediate, Types.Level.Advanced);
    assertThat(budget.chapters().stream().mapToInt(Chapter::estimatedWords).sum()).isEqualTo(4000);
  }
  @Test void droppingALevelOrReversingProgressionIsRejected() {
    project.targetLevels = List.of(Types.Level.Beginner, Types.Level.Advanced);
    assertThatThrownBy(() -> LearningLevels.normalize(project, outline(chapter("a", Types.Level.Beginner)), HttpStatus.BAD_REQUEST))
        .isInstanceOf(ResponseStatusException.class).hasMessageContaining("setiap level");
    assertThatThrownBy(() -> LearningLevels.normalize(project, outline(chapter("b", Types.Level.Advanced), chapter("a", Types.Level.Beginner)), HttpStatus.BAD_REQUEST))
        .isInstanceOf(ResponseStatusException.class).hasMessageContaining("Urutkan bab");
    assertThatThrownBy(() -> LearningLevels.normalize(project, outline(chapter("a", null)), HttpStatus.BAD_GATEWAY))
        .isInstanceOf(ResponseStatusException.class).hasMessageContaining("satu level");
  }
  @Test void legacyProjectsAndChaptersKeepTheirOriginalSingleLevel() {
    project.targetLevel = Types.Level.Intermediate;
    var result = LearningLevels.normalize(project, outline(new Chapter("a", "A", 1)), HttpStatus.BAD_REQUEST);
    assertThat(result.chapters().getFirst().level()).isEqualTo(Types.Level.Intermediate);
    var converter = new LevelListConverter();
    assertThat(converter.convertToEntityAttribute(converter.convertToDatabaseColumn(List.of(Types.Level.Beginner, Types.Level.Advanced))))
        .containsExactly(Types.Level.Beginner, Types.Level.Advanced);
  }
}

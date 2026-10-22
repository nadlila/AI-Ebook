package com.thinkerlab.backend.service;
import com.thinkerlab.backend.domain.*;
import com.thinkerlab.backend.api.model.Chapter;
import com.thinkerlab.backend.api.request.OutlineInput;
import java.util.*;
import org.springframework.http.HttpStatus;
public final class LearningLevels {
  private LearningLevels() {}
  public static List<Types.Level> selected(Project p) {
    return p.targetLevels == null || p.targetLevels.isEmpty()
        ? List.of(p.targetLevel == null ? Types.Level.Beginner : p.targetLevel)
        : p.targetLevels.stream().distinct().sorted().toList();
  }
  public static OutlineInput normalize(Project p, OutlineInput input, HttpStatus errorStatus) {
    var levels = selected(p);
    var chapters = new ArrayList<Chapter>();
    int previous = -1;
    var covered = EnumSet.noneOf(Types.Level.class);
    for (var c : input.chapters()) {
      var level = c.level() == null && levels.size() == 1 ? levels.getFirst() : c.level();
      if (level == null || !levels.contains(level))
        throw ProjectService.error(errorStatus, "Setiap bab harus memiliki satu level dari cakupan yang dipilih.");
      if (level.ordinal() < previous)
        throw ProjectService.error(errorStatus, "Urutkan bab dari Beginner, Intermediate, lalu Advanced sesuai level yang dipilih.");
      previous = level.ordinal(); covered.add(level);
      chapters.add(new Chapter(c.id(), c.title(), c.lessons(), c.description(), c.estimatedWords(), level));
    }
    if (!covered.containsAll(levels))
      throw ProjectService.error(errorStatus, "Pilih minimal satu bab untuk setiap level pembelajaran yang dipilih.");
    return new OutlineInput(input.title(), input.learningOutcomes(), chapters, input.estimatedReadingTime(), input.candidates());
  }
}

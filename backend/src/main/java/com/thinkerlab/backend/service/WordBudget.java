package com.thinkerlab.backend.service;

import com.thinkerlab.backend.domain.Types.Length;
import com.thinkerlab.backend.domain.Types.BlockType;
import com.thinkerlab.backend.api.model.*;
import com.thinkerlab.backend.api.request.*;
import java.util.*;
import java.util.regex.Pattern;

public final class WordBudget {
  private WordBudget() {}
  private static final Pattern WORD = Pattern.compile("[\\p{L}\\p{N}]+(?:['\\x{2019}\\-][\\p{L}\\p{N}]+)*");
  public static int target(Length length) {
    return length == Length.Long ? 6000 : length == Length.Medium ? 4000 : 2000;
  }
  public static int min(Length length) { return target(length) * 9 / 10; }
  public static int max(Length length) { return length == Length.Long ? 6000 : target(length) * 11 / 10; }
  public static int words(String text) {
    return text == null ? 0 : (int) WORD.matcher(text).results().count();
  }
  public static int words(ChapterContent chapter) {
    return chapter.blocks().stream().filter(b -> b.type() != BlockType.citation)
        .mapToInt(b -> words(b.content()) + (b.items() == null ? 0 : b.items().stream().mapToInt(WordBudget::words).sum())).sum();
  }
  public static Map<String, Object> report(Length length, ContentInput content) {
    int actual = content.chapters().stream().mapToInt(WordBudget::words).sum();
    return Map.of("target", target(length), "min", min(length), "max", max(length), "actual", actual,
        "withinRange", actual >= min(length) && actual <= max(length));
  }
  public static OutlineInput allocate(Length length, OutlineInput input) {
    int target = target(length), weight = input.chapters().stream().mapToInt(Chapter::lessons).sum();
    int remaining = target;
    var chapters = new ArrayList<Chapter>();
    for (int i = 0; i < input.chapters().size(); i++) {
      var c = input.chapters().get(i);
      int words = i == input.chapters().size() - 1 ? remaining : target * c.lessons() / weight;
      remaining -= words;
      chapters.add(new Chapter(c.id(), c.title(), c.lessons(), c.description(), words, c.level()));
    }
    return new OutlineInput(input.title(), input.learningOutcomes(), chapters,
        ((target + 199) / 200) + " menit", input.candidates());
  }
}

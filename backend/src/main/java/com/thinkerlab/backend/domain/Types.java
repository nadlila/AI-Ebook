package com.thinkerlab.backend.domain;

public final class Types {
  private Types() {}

  public enum Role {
    AUTHOR,
    READER
  }

  public enum ContentType {
    EBOOK,
    MODULE
  }

  public enum Status {
    DRAFT,
    RESEARCH_READY,
    OUTLINE_REVIEW,
    GENERATING,
    NEEDS_REVIEW,
    APPROVED,
    PUBLISHED,
    UNPUBLISHED
  }

  public enum BlockType {
    heading,
    paragraph,
    list,
    callout,
    image,
    quiz,
    citation
  }

  public enum Level {
    Beginner,
    Intermediate,
    Advanced
  }

  public enum Length {
    Short,
    Medium,
    Long
  }
}

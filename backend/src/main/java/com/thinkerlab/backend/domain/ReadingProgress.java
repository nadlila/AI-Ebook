package com.thinkerlab.backend.domain;

import jakarta.persistence.*;

@Entity
@Table(
    name = "reader_progress",
    uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "publicationId"}))
public class ReadingProgress {
  @Id public java.util.UUID id;

  @Column(nullable = false)
  public java.util.UUID userId;

  @Column(nullable = false)
  public java.util.UUID publicationId;

  @Column(nullable = false)
  public java.util.UUID contentVersionId;

  @Column(nullable = false)
  public int chapterIndex;

  @Column(nullable = false)
  public int completion;

  @Version
  @Column(nullable = false)
  public Long revision;

  @Column(nullable = false, updatable = false)
  public java.time.Instant createdAt;

  @Column(nullable = false)
  public java.time.Instant updatedAt;

  @PrePersist
  void created() {
    createdAt = updatedAt = java.time.Instant.now();
  }

  @PreUpdate
  void updated() {
    updatedAt = java.time.Instant.now();
  }
}

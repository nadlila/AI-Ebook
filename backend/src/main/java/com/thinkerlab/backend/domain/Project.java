package com.thinkerlab.backend.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "projects")
public class Project {
  @Id public java.util.UUID id;

  @Column(nullable = false)
  public java.util.UUID ownerId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  public Types.ContentType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  public Types.Status status = Types.Status.DRAFT;

  @Column(nullable = false, length = 200)
  public String title;

  @Column(columnDefinition = "text")
  public String description;

  @Column(columnDefinition = "text")
  public String learningGoal;

  @Column(length = 500)
  public String audience;

  @Enumerated(EnumType.STRING)
  @Column(length = 32)
  public Types.Level targetLevel;

  @Column(length = 64)
  public String language;

  @Column(length = 100)
  public String writingStyle;

  @Enumerated(EnumType.STRING)
  @Column(length = 16)
  public Types.Length contentLength;

  @Column(length = 2048)
  public String coverImage;

  public java.util.UUID approvedOutlineId;
  public java.util.UUID currentVersionId;
  public java.util.UUID approvedVersionId;

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

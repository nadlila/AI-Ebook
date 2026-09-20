package com.thinkerlab.backend.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "issues")
public class Issue {
  @Id public java.util.UUID id;

  @Column(nullable = false)
  public java.util.UUID publicationId;

  @Column(nullable = false)
  public java.util.UUID reportedBy;

  @Column(length = 100)
  public String blockId;

  @Column(nullable = false, length = 2000)
  public String message;

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

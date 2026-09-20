package com.thinkerlab.backend.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "publications")
public class Publication {
  @Id public java.util.UUID id;

  @Column(nullable = false, unique = true)
  public java.util.UUID projectId;

  @Column(nullable = false)
  public java.util.UUID contentVersionId;

  @Column(nullable = false, unique = true, length = 240)
  public String slug;

  @Column(nullable = false, length = 200)
  public String title;

  @Column(columnDefinition = "text")
  public String description;

  @Column(length = 2048)
  public String coverImage;

  @Column(nullable = false)
  public boolean published;

  @Column(nullable = false)
  public java.time.Instant publishedAt;

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

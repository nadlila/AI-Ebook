package com.thinkerlab.backend.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "content_versions")
public class ContentVersion {
  @Id public java.util.UUID id;

  @Column(nullable = false)
  public java.util.UUID projectId;

  @Column(nullable = false)
  public java.util.UUID outlineId;

  @Column(nullable = false, columnDefinition = "text")
  public String payload;

  @Column(nullable = false)
  public java.util.UUID createdBy;

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

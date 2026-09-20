package com.thinkerlab.backend.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "sources")
public class Source {
  @Id public java.util.UUID id;

  @Column(nullable = false)
  public java.util.UUID projectId;

  @Column(nullable = false, length = 200)
  public String title;

  @Column(nullable = false, length = 200)
  public String publisher;

  @Column(nullable = false, length = 2048)
  public String url;

  @Column(nullable = false, columnDefinition = "text")
  public String excerpt;

  @Column(nullable = false)
  public boolean selected = true;

  @Column(nullable = false)
  public boolean locked = false;

  @Column(nullable = false)
  public java.time.Instant accessDate;

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

package com.thinkerlab.backend.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "audit_events")
public class AuditEvent {
  @Id public java.util.UUID id;

  @Column(nullable = false)
  public java.util.UUID actorId;

  @Column(nullable = false)
  public java.util.UUID projectId;

  @Column(nullable = false, length = 80)
  public String action;

  public java.util.UUID referenceId;

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

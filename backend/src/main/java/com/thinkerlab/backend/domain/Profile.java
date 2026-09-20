package com.thinkerlab.backend.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "profiles")
public class Profile {
  @Id public java.util.UUID id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  public Types.Role role = Types.Role.READER;

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

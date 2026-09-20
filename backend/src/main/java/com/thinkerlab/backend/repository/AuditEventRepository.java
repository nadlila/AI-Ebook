package com.thinkerlab.backend.repository;

import com.thinkerlab.backend.domain.AuditEvent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {
  java.util.List<AuditEvent> findByProjectIdOrderByCreatedAtDesc(java.util.UUID id);
}

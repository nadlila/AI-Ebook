package com.thinkerlab.backend.repository;

import com.thinkerlab.backend.domain.Outline;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutlineRepository extends JpaRepository<Outline, UUID> {
  java.util.List<Outline> findByProjectIdOrderByCreatedAtDesc(java.util.UUID projectId);
}

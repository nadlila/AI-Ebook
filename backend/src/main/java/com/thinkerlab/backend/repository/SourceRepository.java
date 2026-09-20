package com.thinkerlab.backend.repository;

import com.thinkerlab.backend.domain.Source;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SourceRepository extends JpaRepository<Source, UUID> {
  java.util.List<Source> findByProjectIdOrderByCreatedAt(java.util.UUID projectId);
}

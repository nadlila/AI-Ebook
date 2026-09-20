package com.thinkerlab.backend.repository;

import com.thinkerlab.backend.domain.ContentVersion;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentVersionRepository extends JpaRepository<ContentVersion, UUID> {
  java.util.List<ContentVersion> findByProjectIdOrderByCreatedAtDesc(java.util.UUID projectId);
}

package com.thinkerlab.backend.repository;

import com.thinkerlab.backend.domain.Project;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
  org.springframework.data.domain.Page<Project> findByOwnerId(
      java.util.UUID ownerId, org.springframework.data.domain.Pageable page);
}

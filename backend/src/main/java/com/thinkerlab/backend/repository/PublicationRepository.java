package com.thinkerlab.backend.repository;

import com.thinkerlab.backend.domain.Publication;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublicationRepository extends JpaRepository<Publication, UUID> {
  java.util.Optional<Publication> findByProjectId(java.util.UUID id);

  org.springframework.data.domain.Page<Publication> findByPublishedTrueAndTitleContainingIgnoreCase(
      String title, org.springframework.data.domain.Pageable page);
}

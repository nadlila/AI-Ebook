package com.thinkerlab.backend.repository;

import com.thinkerlab.backend.domain.Publication;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublicationRepository extends JpaRepository<Publication, UUID> {
  java.util.Optional<Publication> findByProjectId(java.util.UUID id);

  @org.springframework.data.jpa.repository.Query("select p from Publication p where p.published = true "
      + "and p.projectId in (select e.id from Project e where e.ownerId = :ownerId) "
      + "and lower(p.title) like lower(concat('%', :title, '%'))")
  org.springframework.data.domain.Page<Publication> findOwnedLibrary(
      @org.springframework.data.repository.query.Param("ownerId") UUID ownerId,
      @org.springframework.data.repository.query.Param("title") String title,
      org.springframework.data.domain.Pageable page);
}

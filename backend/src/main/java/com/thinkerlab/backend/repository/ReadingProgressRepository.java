package com.thinkerlab.backend.repository;

import com.thinkerlab.backend.domain.ReadingProgress;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, UUID> {
  java.util.Optional<ReadingProgress> findByUserIdAndPublicationId(
      java.util.UUID user, java.util.UUID publication);
}

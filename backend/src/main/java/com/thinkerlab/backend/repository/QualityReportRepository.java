package com.thinkerlab.backend.repository;

import com.thinkerlab.backend.domain.QualityReport;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QualityReportRepository extends JpaRepository<QualityReport, UUID> {
  java.util.Optional<QualityReport> findFirstByContentVersionIdOrderByCreatedAtDesc(
      java.util.UUID id);
}

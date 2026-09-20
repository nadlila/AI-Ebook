package com.thinkerlab.backend.repository;

import com.thinkerlab.backend.domain.Issue;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IssueRepository extends JpaRepository<Issue, UUID> {}

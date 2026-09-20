package com.thinkerlab.backend.api;

import com.thinkerlab.backend.api.Contracts.*;
import com.thinkerlab.backend.domain.*;
import com.thinkerlab.backend.service.ReaderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/library")
@Validated
public class ReaderController {
  private final ReaderService service;

  public ReaderController(ReaderService service) {
    this.service = service;
  }

  @GetMapping
  public PageResult<Publication> library(
      @RequestParam(defaultValue = "") @Size(max = 200) String search,
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
    return service.library(search, page, size);
  }

  @GetMapping("/{id}")
  public Map<String, Object> read(@PathVariable UUID id) {
    return service.read(id);
  }

  @GetMapping("/{id}/progress")
  public Map<String, Object> progress(@PathVariable UUID id) {
    return service.progress(id);
  }

  @PutMapping("/{id}/progress")
  public ReadingProgress progress(@PathVariable UUID id, @Valid @RequestBody ProgressInput input) {
    return service.saveProgress(id, input);
  }

  @PostMapping("/{id}/issues")
  public Issue issue(@PathVariable UUID id, @Valid @RequestBody IssueInput input) {
    return service.report(id, input);
  }
}

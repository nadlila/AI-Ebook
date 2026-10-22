package com.thinkerlab.backend.controller;
import com.thinkerlab.backend.service.*;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.http.*;

@RestController
@Validated
@RequestMapping("/api/ebooks/{id}/cover/photos")
public class StockPhotoController {
  private final ProjectService projects;
  private final StockPhotoService photos;
  public StockPhotoController(ProjectService projects, StockPhotoService photos) {
    this.projects = projects; this.photos = photos;
  }
  @GetMapping
  public List<StockPhotoService.Photo> search(@PathVariable UUID id,
      @RequestParam @NotBlank @Size(max = 150) String query,
      @RequestParam(defaultValue = "1") @Min(1) @Max(100) int page) {
    projects.owned(id);
    return photos.search(query, page);
  }
  @PostMapping("/{photoId}/download")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void trackDownload(@PathVariable UUID id,
      @PathVariable @Pattern(regexp = "[A-Za-z0-9_-]{1,100}") String photoId) {
    projects.owned(id);
    photos.trackDownload(photoId);
  }
}

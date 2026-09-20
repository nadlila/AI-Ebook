package com.thinkerlab.backend.api;

import com.thinkerlab.backend.security.Actor;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AccountController {
  private final Actor actor;

  public AccountController(Actor actor) {
    this.actor = actor;
  }

  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "UP");
  }

  @GetMapping("/auth/me")
  public Map<String, Object> me() {
    return Map.of("id", actor.id(), "role", actor.role());
  }
}

package com.thinkerlab.backend.security;

import com.thinkerlab.backend.domain.*;
import com.thinkerlab.backend.repository.ProfileRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class Actor {
  private final ProfileRepository profiles;

  public Actor(ProfileRepository profiles) {
    this.profiles = profiles;
  }

  public UUID id() {
    return UUID.fromString(
        ((Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getSubject());
  }

  public Types.Role role() {
    return profiles.findById(id()).map(p -> p.role).orElse(Types.Role.READER);
  }

  public void requireAuthor() {
    if (role() != Types.Role.AUTHOR)
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role AUTHOR diperlukan.");
  }
}

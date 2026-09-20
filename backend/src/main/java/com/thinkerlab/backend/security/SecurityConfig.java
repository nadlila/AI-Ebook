package com.thinkerlab.backend.security;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

@Configuration
public class SecurityConfig {
  @Bean
  JwtDecoder jwtDecoder(
      @Value("${app.auth.issuer}") String issuer, @Value("${app.auth.jwks-uri}") String uri) {
    var decoder =
        NimbusJwtDecoder.withJwkSetUri(uri)
            .jwsAlgorithm(SignatureAlgorithm.RS256)
            .jwsAlgorithm(SignatureAlgorithm.ES256)
            .build();
    OAuth2TokenValidator<Jwt> audience =
        jwt ->
            jwt.getAudience().contains("authenticated")
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token", "Invalid audience", null));
    OAuth2TokenValidator<Jwt> subject =
        jwt -> {
          try {
            if (jwt.getExpiresAt() == null) throw new IllegalArgumentException();
            UUID.fromString(jwt.getSubject());
            return OAuth2TokenValidatorResult.success();
          } catch (RuntimeException e) {
            return OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "Invalid subject", null));
          }
        };
    decoder.setJwtValidator(
        new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer(issuer), audience, subject));
    return decoder;
  }

  @Bean
  SecurityFilterChain security(
      HttpSecurity http,
      @org.springframework.beans.factory.annotation.Qualifier("cors")
          CorsConfigurationSource source)
      throws Exception {
    return http.csrf(c -> c.disable())
        .cors(c -> c.configurationSource(source))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            a -> a.requestMatchers("/api/health").permitAll().anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(j -> {}))
        .build();
  }

  @Bean
  CorsConfigurationSource cors(@Value("${app.cors.origins}") String origins) {
    var c = new CorsConfiguration();
    c.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).toList());
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    c.setAllowedHeaders(List.of("Authorization", "Content-Type", "If-Match"));
    c.setExposedHeaders(List.of("ETag"));
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", c);
    return source;
  }
}

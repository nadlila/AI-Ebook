package com.thinkerlab.backend.security;

import static org.assertj.core.api.Assertions.*;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.*;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.security.oauth2.jwt.*;

class JwtValidationTest {
  static HttpServer server;
  static RSAKey key;
  static JwtDecoder decoder;
  static final String ISSUER = "https://test.supabase.co/auth/v1";

  @BeforeAll
  static void setup() throws Exception {
    key = new RSAKeyGenerator(2048).keyID("test-key").generate();
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/jwks",
        exchange -> {
          byte[] body = new JWKSet(key.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);
          exchange.getResponseHeaders().add("Content-Type", "application/json");
          exchange.sendResponseHeaders(200, body.length);
          try (var out = exchange.getResponseBody()) {
            out.write(body);
          }
        });
    server.start();
    decoder =
        new SecurityConfig()
            .jwtDecoder(ISSUER, "http://127.0.0.1:" + server.getAddress().getPort() + "/jwks");
  }

  @AfterAll
  static void stop() {
    if (server != null) server.stop(0);
  }

  String token(String issuer, String audience, String subject, Instant expiry, RSAKey signingKey)
      throws Exception {
    var claims =
        new JWTClaimsSet.Builder()
            .issuer(issuer)
            .audience(audience)
            .subject(subject)
            .issueTime(Date.from(Instant.now()))
            .expirationTime(expiry == null ? null : Date.from(expiry))
            .build();
    var jwt =
        new SignedJWT(
            new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims);
    jwt.sign(new RSASSASigner(signingKey));
    return jwt.serialize();
  }

  @Test
  void validSignedTokenAccepted() throws Exception {
    String subject = UUID.randomUUID().toString();
    assertThat(
            decoder
                .decode(
                    token(ISSUER, "authenticated", subject, Instant.now().plusSeconds(300), key))
                .getSubject())
        .isEqualTo(subject);
  }

  @Test
  void expiredTokenRejected() throws Exception {
    String token =
        token(
            ISSUER,
            "authenticated",
            UUID.randomUUID().toString(),
            Instant.now().minusSeconds(300),
            key);
    assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
  }

  @Test
  void wrongIssuerRejected() throws Exception {
    String token =
        token(
            "https://attacker.example",
            "authenticated",
            UUID.randomUUID().toString(),
            Instant.now().plusSeconds(300),
            key);
    assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
  }

  @Test
  void wrongAudienceRejected() throws Exception {
    String token =
        token(ISSUER, "anon", UUID.randomUUID().toString(), Instant.now().plusSeconds(300), key);
    assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
  }

  @Test
  void wrongSignatureRejected() throws Exception {
    String token =
        token(
            ISSUER,
            "authenticated",
            UUID.randomUUID().toString(),
            Instant.now().plusSeconds(300),
            new RSAKeyGenerator(2048).generate());
    assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
  }

  @Test
  void invalidSubjectRejected() throws Exception {
    String token =
        token(ISSUER, "authenticated", "not-a-user-uuid", Instant.now().plusSeconds(300), key);
    assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
  }

  @Test
  void missingExpiryRejected() throws Exception {
    String token = token(ISSUER, "authenticated", UUID.randomUUID().toString(), null, key);
    assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
  }
}

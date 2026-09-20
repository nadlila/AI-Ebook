# Hasil validasi lokal

Dijalankan 19 September 2026, menggunakan JDK 21 dan Maven pada paket ini.

Perintah: `mvn -B -ntp package`.

Hasil: **BUILD SUCCESS — 18 tests, 0 failures, 0 errors, 0 skipped**. JAR executable Spring Boot berhasil dibuat.

- 11 integration tests mencakup Spring MVC, Security, JPA, skema SQL, role/ownership, publication flow, citation, versions, restore, reading progress, dan CORS.
- 7 JWT tests menggunakan RSA signature dan JWKS HTTP lokal: token valid, expiry, missing expiry, issuer, audience, signature salah, dan subject salah.
- Database integrasi menggunakan H2 mode PostgreSQL dan `ddl-auto=validate` dengan SQL skema yang disertakan.

Belum diuji terhadap project Supabase nyata, frontend Angular nyata, atau provider AI. Percobaan menjalankan PostgreSQL lokal terhalang pembatasan shared memory lingkungan; hasil H2 tidak diklaim sebagai uji PostgreSQL/Supabase. Uji beban, keamanan menyeluruh, serta UAT PRD belum dilakukan.

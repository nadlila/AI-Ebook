# ThinkerLab backend

Backend awal dari proyek Spring Boot milikmu: Spring Boot 4.1.1, Java 21, Spring Security, JPA, dan PostgreSQL Supabase. Dua role aplikasi: AUTHOR dan READER.

Implementasi ini menjalankan alur **sumber yang disediakan author → outline manual → persetujuan outline → konten/editor → pemeriksaan struktur → review manusia → publish → reader**. Ini belum merupakan seluruh implementasi PRD AI. Research web, model AI, generation asynchronous/retry/cancel, estimasi biaya, dan evaluasi fakta belum diimplementasikan karena provider/model dan budget belum ditentukan. Tidak ada hasil AI mock yang dianggap sebagai hasil asli.

## Fitur yang sudah tersedia

- Validasi access token Supabase Auth melalui JWKS, issuer, audience, expiry, dan subject UUID. Mendukung signing key RS256/ES256.
- Akun tanpa entri author dianggap READER; role tidak diambil dari input frontend atau user_metadata.
- AUTHOR membuat dan mengubah proyek EBOOK/MODULE miliknya. Akses project orang lain menghasilkan 404.
- Sumber dari author, selected/locked source, outline berversi, dan persetujuan outline.
- Konten per bab/block dan citation source ID; versi lama tidak ditimpa, restore membuat versi baru.
- Quality check struktural: block kosong, citation tanpa sumber, bab tanpa citation, dan paragraf identik.
- Approval manusia untuk versi konten tertentu, publish idempotent, unpublish, dan audit trail.
- Library hanya menampilkan publikasi aktif; reader mendapatkan versi terbit dan metadata citation tanpa excerpt sumber privat.
- Progres baca per user dan per versi publikasi, serta pelaporan masalah pada block.
- Optimistic locking melalui `revision` dan `If-Match`; request frontend tidak bisa mengatur status atau owner secara langsung.
- CORS untuk origin frontend yang dikonfigurasi; validasi input dan pagination.

## Menjalankan lokal dengan Supabase

1. Gunakan JDK 21 dan Maven, atau Maven Wrapper yang sudah ada.
2. Siapkan project Supabase. Autentikasi sementara menggunakan Supabase Auth. Pastikan JWT signing key memakai RS256 atau ES256; konfigurasi ini tidak menerima legacy HS256.
3. Di Supabase SQL Editor, jalankan isi `src/main/resources/db/V001__initial_schema.sql` **sekali** pada schema baru. Lalu jalankan `database/supabase_permissions.sql`.
4. Jangan tambahkan schema `ebook_app` ke daftar Exposed schemas Supabase Data API. Backend mengakses PostgreSQL melalui JDBC; Angular mengakses konten melalui REST backend.
5. Buat user lewat Supabase Auth. Untuk author pertama, ganti UUID contoh di `database/grant_author.sql` dengan UUID user, lalu jalankan SQL-nya. Semua user lain default READER. Tidak ada endpoint yang membolehkan user mempromosikan dirinya sendiri.
6. Isi environment variables dari `.env.example` lewat Run Configuration IDE atau terminal. Gunakan JDBC host/username dari menu Connect Supabase; session pooler port 5432 biasanya paling praktis. Jangan gunakan URL REST Supabase sebagai JDBC URL.
7. Jalankan:

```sh
./mvnw spring-boot:run
```

Jika permission wrapper belum executable: `chmod +x mvnw`, atau gunakan `mvn spring-boot:run`.

Spring Boot **tidak otomatis membaca file `.env`**. Menaruh nilai di file itu saja belum cukup; variabel harus diekspor atau dimasukkan ke konfigurasi IDE. Contoh terminal:

```sh
export DB_URL='jdbc:postgresql://YOUR_SESSION_POOLER_HOST:5432/postgres?sslmode=require'
export DB_USERNAME='postgres.YOUR_PROJECT_REF'
export DB_PASSWORD='isi-password-lokal'
export SUPABASE_URL='https://YOUR_PROJECT_REF.supabase.co'
export CORS_ALLOWED_ORIGINS='http://localhost:4200'
./mvnw spring-boot:run
```

`GET http://localhost:8080/api/health` memeriksa aplikasi hidup. Endpoint ini bukan pemeriksaan konektivitas database lengkap. Endpoint lain memerlukan `Authorization: Bearer <Supabase access_token>`.

Jangan kirim password database atau service-role key ke Angular. Kredensial asli tidak disertakan dalam paket ini.

## Login dan frontend

Login/register/refresh/logout ditangani Supabase Auth SDK di Angular. Setelah login, Angular mengirim access token ke backend dan memanggil `GET /api/auth/me` untuk mendapatkan role aplikasi. Tidak ada endpoint `/auth/login` atau `/auth/register` pada paket ini.

Baca `docs/API.md` untuk endpoint, format request, mapping frontend, dan batasan. `docs/requests.http` menyediakan contoh request berurutan untuk IntelliJ HTTP Client/VS Code REST Client; isi variabel dari respons aktual.

Frontend ZIP belum diubah. Service frontend saat ini memakai mock/localStorage dan perlu diganti oleh partner FE dengan panggilan HTTP. Backend ini tidak langsung kompatibel dengan seluruh bentuk `Ebook` lama, terutama publication ID, pagination, approval, status, dan version ID.

## Struktur kode

- `api/`: controller, DTO request dan validasi, respons error.
- `security/`: validasi JWT, CORS, identitas dan role.
- `domain/`: entitas JPA, role, tipe dan status.
- `repository/`: akses database.
- `service/`: transaksi, kepemilikan data, aturan alur, versioning, publikasi dan reader.
- `src/main/resources/db/`: migrasi SQL manual awal.
- `src/test/`: pengujian HTTP/service/JPA dengan H2 dan validasi JWT dengan JWKS lokal.

Migrasi dijalankan manual pada tahap ini; Flyway belum ditambahkan. Aplikasi memakai `ddl-auto=validate` agar tidak mengubah skema Supabase diam-diam. Tabel berada di schema `ebook_app`, terpisah dari schema `auth` Supabase.

## Pengujian

```sh
./mvnw test
./mvnw package
```

Tests tidak memerlukan kredensial Supabase atau API AI. Database test H2 mode PostgreSQL menjalankan file skema yang sama dan Hibernate memvalidasi pemetaannya. Pengujian ini belum membuktikan koneksi ke project Supabase nyata.

Pengujian mencakup isolasi owner, reader yang mencoba menulis, stale revision, approval/quality gate, immutable versions, restore, publish berulang, unpublish, pemisahan progres reader, lintas-project citation, source lock, CORS, dan validasi signature/issuer/audience/expiry JWT.

## Keputusan dan batasan tahap ini

- AUTHOR melakukan review dan publish kontennya sendiri; workflow editor/admin PRD belum dibuat.
- Sumber diberikan sebagai URL + excerpt oleh author. Backend belum mengambil URL itu, sehingga `accessDate` di tahap ini merupakan waktu pencatatan sumber, bukan bukti retrieval web berhasil.
- Sumber dibekukan setelah outline disetujui. Struktur bab dibekukan setelah versi konten pertama. Perubahan struktur besar membutuhkan project baru untuk saat ini.
- Edit konten terbit diawali unpublish. Snapshot publikasi lama tidak ditimpa oleh draft, tetapi belum ada revisi draft paralel dengan publikasi aktif.
- Quality check hanya struktur; bukan skor akurasi/readability/safety/copyright. Review manusia eksplisit tetap diperlukan.
- Konten block diperlakukan sebagai plain text/structured data, bukan HTML tepercaya. Frontend harus melakukan escaping dan tidak menggunakan `bypassSecurityTrustHtml` untuk isi user.
- Belum ada upload/Storage signed URL, cover generation, background jobs, AI research/writer/evaluator, biaya/quota, dashboard khusus, delete/archive, rollback publikasi satu langkah, atau PDF/EPUB export.
- Riwayat outline/versi/audit belum dipaginasi; perlu pagination dan retention sebelum pemakaian besar.
- Belum ada rate limiting dan deployment/monitoring produksi. Pengujian beban dan UAT PRD belum dilakukan.

Role baru nantinya ditambahkan lewat permission policy dan migrasi schema; aturan kepemilikan tetap dipertahankan. Untuk langkah berikutnya dibutuhkan keputusan provider/model AI serta pilihan final apakah Supabase Auth akan dipakai.

Referensi konfigurasi: [Supabase JWT](https://supabase.com/docs/guides/auth/jwts), [Supabase signing keys](https://supabase.com/docs/guides/auth/signing-keys), [Spring Boot build systems](https://docs.spring.io/spring-boot/reference/using/build-systems.html).

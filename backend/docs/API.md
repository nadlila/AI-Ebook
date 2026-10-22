# Kontrak API untuk frontend Angular

> Perubahan terbaru: semua ebook dan endpoint library hanya dapat diakses pemilik. `PUBLISHED` berarti siap dibaca di library pribadi. Lihat [kontrak library pribadi](PRIVATE_LIBRARY.md) untuk pemetaan frontend dan aturan akses terbaru.

Base URL: `http://localhost:8080/api`. JSON request memakai `Content-Type: application/json`. Selain `/health`, semua endpoint memerlukan `Authorization: Bearer <access_token Supabase>`.

## Autentikasi dan role

`GET /auth/me` → `{ "id": "uuid-user", "role": "AUTHOR" }` atau READER. AUTHOR boleh menggunakan API library juga. Role diperiksa dari tabel server pada setiap request.

`GET /capabilities` mengembalikan daftar kemampuan. `aiResearch` dan `aiGeneration` mengikuti ketersediaan konfigurasi Gemini; `backgroundJobs` tetap false. Konfigurasi tersedia belum menjamin key atau kuota valid. Lihat [endpoint riset web](WEB_RESEARCH.md#kontrak-api).

Login/register/refresh/logout dilakukan dengan Supabase Auth SDK di frontend. Auth model frontend lama (`{token, user}`) dapat diadaptasi dari session Supabase, lalu tambahkan role hasil `/auth/me`. Kirim access token, bukan anon key atau refresh token, pada header backend.

## Konkurensi

Setiap mutasi project yang sudah ada memakai header `If-Match: <revision>` dari `GET /ebooks/{id}`. Contoh: `If-Match: 3`. Bentuk `"3"` juga diterima. Sesudah mutasi child (source/outline/content/quality), **GET ulang project** untuk mengambil revision terbaru. Bila menerima 409, tampilkan konflik dan muat ulang; jangan menimpa edit user dengan retry otomatis.

Create project tidak memerlukan If-Match. Reader progress juga tidak memerlukan If-Match; penyimpanan bersamaan bisa menghasilkan 409 dan harus diulang setelah reload. Publish berulang atas versi yang sama mengembalikan publikasi yang sama.

## Endpoint author

| Method | Path | Body/hasil |
|---|---|---|
| POST | `/ebooks` | ProjectInput → Project (201) |
| GET | `/ebooks?page=0&size=20` | `{items,totalElements,page,size}` milik author |
| GET | `/ebooks/{id}` | Project, termasuk `revision` |
| PUT | `/ebooks/{id}` | ProjectInput → Project |
| GET | `/ebooks/{id}/sources` | Source[] |
| POST | `/ebooks/{id}/sources` | SourceInput → Source (201) |
| PATCH | `/ebooks/{id}/sources/{sourceId}` | `{selected,locked}` → Source |
| DELETE | `/ebooks/{id}/sources/{sourceId}` | 204; locked source harus dibuka dahulu |
| GET | `/ebooks/{id}/outlines` | versi outline, terbaru dahulu |
| POST | `/ebooks/{id}/outlines` | OutlineInput → `{id,outline}` (201) |
| POST | `/ebooks/{id}/outlines/{outlineId}/approve` | tanpa body → Project |
| GET | `/ebooks/{id}/content` | `{id,outlineId,createdAt,content:{chapters}}` |
| PUT | `/ebooks/{id}/content` | ContentInput → versi baru |
| GET | `/ebooks/{id}/versions` | versi konten, terbaru dahulu |
| POST | `/ebooks/{id}/versions/{versionId}/restore` | tanpa body → versi baru |
| POST | `/ebooks/{id}/quality-check` | tanpa body → QualityResult |
| GET | `/ebooks/{id}/quality-check` | hasil untuk versi saat ini |
| POST | `/ebooks/{id}/approve` | `{contentVersionId,humanReviewConfirmed:true}` → Project |
| POST | `/ebooks/{id}/publish` | tanpa body → Publication |
| POST | `/ebooks/{id}/unpublish` | tanpa body → Project |
| GET | `/ebooks/{id}/audit` | AuditEvent[] |

Semua mutasi pada project yang ada memerlukan If-Match. `id` project, outline, source, content version, dan publication adalah UUID yang berbeda. ID chapter/block adalah string stabil yang dibuat editor dan unik dalam cakupan ebook.

### ProjectInput

```json
{
  "type": "EBOOK",
  "title": "Dasar UX Research",
  "description": "Panduan pengantar",
  "learningGoal": "Mampu menyusun rencana riset pengguna",
  "audience": "Desainer pemula",
  "targetLevel": "Beginner",
  "language": "Indonesia",
  "writingStyle": "Friendly",
  "contentLength": "Short",
  "coverImage": null
}
```

`type`: EBOOK/MODULE. `targetLevel`: Beginner/Intermediate/Advanced. `contentLength`: Short/Medium/Long. PUT merupakan penggantian field metadata, jadi kirim semua field wajib. Field `ownerId`, `status`, `revision`, dan `approvedVersionId` tidak boleh dikirim sebagai body input.

### SourceInput

```json
{
  "title": "Catatan riset pengguna",
  "publisher": "Tim penulis",
  "url": "https://example.org/research",
  "excerpt": "Isi sumber yang diberikan author untuk mendukung penulisan."
}
```

Tidak ada klaim bahwa URL telah diambil atau diverifikasi oleh backend. URL harus HTTP/HTTPS. Sumber hanya dapat dipilih/dihapus sebelum persetujuan outline; `locked:true` hanya boleh untuk `selected:true`. Untuk menghapus locked source, PATCH `{selected:true,locked:false}` dahulu, reload revision, lalu DELETE.

### OutlineInput

```json
{
  "title": "Dasar UX Research",
  "learningOutcomes": ["Memahami tujuan riset pengguna"],
  "chapters": [{"id":"chapter-1","title":"Pengantar","lessons":1}]
}
```

Hanya outline terbaru boleh disetujui. Perubahan metadata sebelum konten dibuat membatalkan persetujuan outline. Outline approval tidak berarti konten sudah terbit.

### ContentInput

```json
{
  "chapters": [{
    "chapterId": "chapter-1",
    "title": "Pengantar",
    "blocks": [{
      "id": "block-1",
      "type": "paragraph",
      "content": "Isi tulisan yang telah direview author.",
      "sourceId": "UUID-SOURCE-DARI-API",
      "citationLabel": "[1]"
    }]
  }]
}
```

Urutan dan ID bab harus sama dengan outline yang disetujui. `type` block: heading, paragraph, list, callout, image, quiz, citation. `items` opsional untuk list. Image/quiz masih perlu review dan penanganan frontend; belum ada upload atau evaluasi quiz. Citation harus menunjuk sumber terpilih pada project yang sama. Satu atau lebih block boleh merujuk satu sumber; sumber tidak boleh milik project lain.

`QualityResult`: `{contentVersionId,passed,issues:[{code,severity,description,blockId}],scope}`. `scope` menjelaskan pemeriksaan hanya struktural. `passed:true` tidak menyatakan faktanya benar. Tidak ada skor readability/unsupportedClaims buatan untuk mengisi UI lama.

## Endpoint reader (juga boleh untuk author)

| Method | Path | Hasil |
|---|---|---|
| GET | `/library?search=ux&page=0&size=20` | publikasi aktif, paginated |
| GET | `/library/{publicationId}` | `{publication,content:{chapters},sources}` |
| GET | `/library/{publicationId}/progress` | `{publicationId,contentVersionId,chapterIndex,completion}` |
| PUT | `/library/{publicationId}/progress` | body `{contentVersionId,chapterIndex,completion}` |
| POST | `/library/{publicationId}/issues` | body `{blockId,message}`; blockId boleh null |

`chapterIndex` berbasis nol; `completion` 0–100, dihitung frontend. Content version harus sama dengan versi publikasi saat request. Versi publikasi baru memulai progres tampilan dari nol. Progress tidak dibagikan antar user. Draft tidak tersedia di API library, dan unpublish menyebabkan pembacaan baru menghasilkan 404.

## Mapping ke service frontend yang ada

| Fungsi frontend lama | Integrasi backend |
|---|---|
| `createEbookDraft` | POST `/ebooks`, tambahkan audience/type dan field wajib |
| `updateEbook` | PUT metadata saja; jangan kirim `Partial<Ebook>` berisi status |
| `getEbookById` | author: GET `/ebooks/{id}`, lalu content/outline bila diperlukan |
| `createOutline` / `approveOutline` | endpoint outline di atas; simpan outline UUID |
| `saveEditorContent` | PUT `/content` dengan wrapper `{chapters:[...]}` |
| `getEditorContent` | ambil `response.content.chapters` |
| `runQualityCheck` | POST `/quality-check`, adaptasi format UI ke issues/scope |
| `finalizeEbook` | quality check → review manusia → approve → publish |
| `getLibrary` | GET `/library`; pakai `items` dan publication UUID |
| `updateReadingProgress` | PUT `/library/{publicationId}/progress` |
| `startResearch` | GET/POST `/ebooks/{id}/ai/research`; lihat [kontrak riset](WEB_RESEARCH.md) |
| `getDashboardSnapshot` | belum ada endpoint khusus; compose daftar author dan library |
| `deleteEbook` | belum tersedia; jangan hapus lokal lalu menganggap data server terhapus |

Status backend: DRAFT, RESEARCH_READY, OUTLINE_REVIEW, GENERATING (disediakan untuk pengembangan), NEEDS_REVIEW, APPROVED, PUBLISHED, UNPUBLISHED. Frontend perlu memperbarui union status; `READY_TO_READ` lama bukan status penyimpanan backend. `currentStep`, `creationProgress`, dan `readingTime` belum dihitung backend. Reader memakai publication API, bukan endpoint project author.

## Errors

- 400: input salah, field tidak dikenal, If-Match hilang/format salah.
- 401: token hilang/tidak valid/kedaluwarsa.
- 403: reader mencoba tindakan author, atau CORS origin tidak sesuai.
- 404: resource tidak ada/tidak dimiliki/tidak dipublikasikan.
- 409: state tidak sesuai, stale revision, atau konflik database.

Error domain/validasi body berbentuk RFC ProblemDetail (`status`, `detail`, dan bila relevan `errors`). Respons bawaan framework/security dapat berbeda, jadi frontend tetap harus menangani status HTTP tanpa mengasumsikan setiap error memiliki JSON body.

### Sumber PDF

Jalankan SQL `src/main/resources/db/V004__pdf_sources.sql` sebelum memulai backend dengan database yang sudah ada (ddl-auto=validate).

POST /api/ebooks/{id}/sources/pdf menggunakan multipart/form-data: file, title, publisher, dan url opsional; header If-Match wajib. Respons 201 berupa Source dengan fileName, pageCount, dan excerpt berisi teks semua halaman dengan penanda halaman. PDF asli tidak disimpan. Batas: 10 MB, 300 halaman, 500.000 karakter per PDF dan total sumber terpilih per permintaan AI. Tidak ada pemotongan teks otomatis. PDF terkunci, rusak, atau halaman tanpa teks ditolak dengan 400; lakukan OCR terlebih dahulu. Kutipan manual tetap melalui POST /sources.

### Target kata dan pilihan bab

ContentLength Short: target 2000 (1800-2200), Medium: 4000 (3600-4400), Long: target dan maksimum 6000 (5400-6000).
POST /api/ebooks/{id}/ai/outline menghasilkan calon bab dengan candidates=true. Bab memiliki description dan estimatedWords.
POST /api/ebooks/{id}/ai/outline/finalize dengan body {"chapterIds":["chapter-3","chapter-1"]} dan If-Match menghasilkan outline final dalam urutan pilihan. AI memperjelas cakupan dan kedalaman; server membagi ulang seluruh target kata berdasarkan bobot lessons. ID duplikat/tidak dikenal ditolak. Pilihan calon bab asli tetap tersedia dalam riwayat outline. Approval calon bab ditolak; tinjau outline final sebelum approve.
Konten dibuat per bab dengan target kata yang disetujui dan maksimal satu percobaan perbaikan panjang per bab. Hasil lengkap disimpan setelah semua bab selesai; kegagalan tidak menyimpan konten parsial. Proses dapat memerlukan beberapa menit.
GET /api/ebooks/{id}/content menyertakan wordCount {target,min,max,actual,withinRange}. Penghitungan mencakup heading, paragraf, callout, dan item list; judul bab serta blok citation tidak dihitung. Jumlah kata aktual juga dihitung ulang saat mengedit. Target merupakan estimasi; hasil di luar rentang tetap dapat ditinjau dan diedit. Field baru disimpan di JSON outline, sehingga tidak membutuhkan migrasi SQL tambahan. Outline lama tetap dapat dibaca.

Gemini: respons HTTP 502/503/504 dicoba ulang maksimal dua kali dengan jeda 2 dan 4 detik (total tiga percobaan). Berlaku untuk research, outline, dan setiap permintaan bab. Jika tetap gagal, backend mengembalikan 502 dengan pesan jumlah percobaan. HTTP 400/401/403/429 tidak diulang otomatis. Retry ini hanya menangani respons HTTP sementara; panjang hasil tetap diperiksa terpisah.


### Progres dan draft per tahap

Terapkan src/main/resources/db/V005__workflow_progress.sql sebelum restart backend (ddl-auto=validate). PUT /api/ebooks/{id}/workflow memerlukan If-Match dan body {step, draft}, dengan draft berupa string objek JSON opsional (maksimal 1 juta karakter; total draft maksimal 2 juta). Respons Project menyertakan workflowStep dan workflowDrafts. Draft disimpan per tahap, bukan menimpa tahap lain. Kepemilikan dan revision tetap diperiksa.
Frontend menyediakan Simpan draft untuk preferensi, sumber dan pilihan sumber, learning plan, pilihan/urutan bab, dan editor. Continue menyimpan hasil tahap dan titik lanjut. File PDF lokal harus diunggah sebelum file tersebut tersimpan; draft sumber hanya menyimpan teks formulir dan pilihan. Belum ada autosave pada setiap ketikan.
Progres: preferensi 10%, riset 20%, sumber 30%, learning plan 40%, calon bab 50%, outline final 60%, generation 65%-80% sesuai bab tersimpan, editor 80%, quality check 90%, detail/review akhir 95%, published 100%. Persentase merupakan tahapan alur, bukan estimasi waktu. Draft lama tanpa checkpoint memakai fallback berdasarkan artefak tersimpan.
Generation menyimpan setiap bab berhasil ke draft GENERATION beserta approved outline ID. Setelah gagal, permintaan berikutnya melanjutkan prefix bab yang cocok dengan outline yang disetujui. Outline berbeda tidak memakai draft generation sebelumnya. Setelah seluruh bab selesai, versi konten lengkap dibuat seperti biasa.

### Cakupan level pembelajaran

Jalankan src/main/resources/db/V006__multiple_learning_levels.sql sebelum restart backend. targetLevels adalah array satu sampai tiga nilai Beginner, Intermediate, Advanced. Field targetLevel tunggal tetap diterima untuk kompatibilitas; proyek lama dimigrasikan dengan level aslinya.
Setiap bab outline memiliki field level. Semua level yang dipilih harus memiliki minimal satu bab dan urutannya tidak menurun. Penghapusan cakupan level saat memilih bab ditolak sebelum panggilan AI. Total target kata tidak berubah. Tidak ada permintaan AI tambahan khusus untuk penentuan level: level disertakan dalam permintaan outline/finalisasi/konten yang sudah ada.

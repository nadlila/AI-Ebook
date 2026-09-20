# Kontrak API untuk frontend Angular

Base URL: `http://localhost:8080/api`. JSON request memakai `Content-Type: application/json`. Selain `/health`, semua endpoint memerlukan `Authorization: Bearer <access_token Supabase>`.

## Autentikasi dan role

`GET /auth/me` → `{ "id": "uuid-user", "role": "AUTHOR" }` atau READER. AUTHOR boleh menggunakan API library juga. Role diperiksa dari tabel server pada setiap request.

`GET /capabilities` mengembalikan daftar kemampuan. Saat ini `aiResearch`, `aiGeneration`, dan `backgroundJobs` bernilai false. Frontend harus menonaktifkan tombol fitur AI sampai implementasi provider tersedia.

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
| `startResearch` / `startGeneration` | belum tersedia; lihat `/capabilities` |
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

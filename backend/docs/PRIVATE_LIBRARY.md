# Ebook pribadi dan penyimpanan database

Semua ebook hanya dapat dibuat, diubah, dan dibaca oleh pemiliknya. Tidak ada library publik. Nama endpoint `/library` dan status `PUBLISHED` dipertahankan untuk kompatibilitas: keduanya berarti salinan final untuk dibaca pemilik, bukan distribusi publik.

## Pemetaan halaman

| Halaman | Penyimpanan/API |
|---|---|
| Create / Learning preferences | `ebook_app.projects`, POST/PUT `/api/ebooks` |
| My Draft | Proyek milik akun login yang belum `PUBLISHED` |
| Sumber | `ebook_app.sources`, `/api/ebooks/{id}/sources` |
| Learning plan / Outline | Tujuan di project, hasil belajar dan estimasi waktu di JSON `outlines.payload` |
| Editor / Generation | `ebook_app.content_versions`, versi baru saat konten disimpan |
| Quality check | `ebook_app.quality_reports`, pemeriksaan struktur |
| My Library | Proyek milik akun login berstatus `PUBLISHED` |
| Reader | Snapshot `publications` dan `content_versions`; progres di `reader_progress` |

`GET /api/ebooks/{projectId}/publication` mendapatkan publication ID milik project yang sudah siap dibaca. Navigasi frontend tetap memakai project ID. Progres dikirim menggunakan publication ID dan content version yang benar-benar dibuka. Versi yang sudah berubah ditolak dengan 409.

`GET /api/library` memfilter pemilik di query database sebelum pagination. Detail, progres (GET/PUT), dan pelaporan masalah juga memeriksa pemilik. ID milik akun lain tidak memberikan akses walaupun diketahui.

## Data lama dan konfigurasi

Tidak diperlukan perubahan struktur tabel untuk pembatasan akses ini. Field opsional `estimatedReadingTime` ditambahkan ke payload JSON outline, sehingga outline lama tetap dapat dibaca.

Frontend tidak lagi membaca atau menulis `ai-ebook-store-v1` maupun `ai-ebook-research-sources-v1`. Data dummy lama tidak diimpor atau dihapus otomatis karena tidak memiliki owner yang dapat dipercaya. Session login masih boleh dikelola Supabase SDK di browser; session bukan penyimpanan ebook.

Auth menggunakan Supabase SDK dengan konfigurasi publik dari `/api/config`, atau konfigurasi Angular yang sudah ada jika publishable key backend belum diisi. Konflik Git pada file login/register/config diselesaikan dengan mempertahankan UI akun dan SDK. Pengguna dari penyimpanan token REST lama mungkin perlu login ulang.

Restart backend dan frontend setelah mengambil perubahan. Uji dengan dua akun: buat draft di akun A, refresh, lalu login akun B. Akun B tidak boleh melihat draft, konten final, atau progres milik A. Alur review, penyimpanan versi final, dan progres diuji menggunakan database H2; pemeriksaan Supabase langsung hanya membaca skema dan jumlah record, tanpa menulis data pengguna.

## Batasan yang tetap ada

- Riset web otomatis tersedia melalui Gemini Google Search; lihat [konfigurasi dan migrasi V002](WEB_RESEARCH.md). Upload/generasi cover, audio, ekspor, dan penghapusan ebook belum memiliki implementasi lengkap.
- Outline dan generasi konten memakai integrasi Gemini yang sudah ada; memerlukan konfigurasi provider yang valid. Tidak ada hasil AI dummy yang dimigrasikan sebagai konten asli.
- Ringkasan dashboard mengambil seluruh halaman API dan memuat detail dengan maksimal enam permintaan paralel. Untuk koleksi besar, endpoint ringkasan khusus akan lebih efisien.
- Estimasi waktu baca akhir dihitung dari panjang konten, bukan statistik dummy.

Pemeriksaan baca-saja pada 9 Oktober 2026 menemukan schema `ebook_app` dengan 2 profil, 2 proyek, 0 versi konten, dan 0 progres baca saat pemeriksaan dilakukan.

# Upload cover ebook

Pada detail draft, pilih **Upload / Ganti cover**, lalu pilih gambar JPG/PNG. Gambar langsung disimpan setelah validasi berhasil. Cover ikut snapshot saat ebook disimpan ke My Library. Cover ebook yang sudah PUBLISHED dibekukan bersama snapshot; upload dilakukan sebelum publikasi.

`POST /api/ebooks/{id}/cover` menerima multipart field `file`, JWT, dan header `If-Match`. Backend memeriksa pemilik, revision, dan status proyek. Perubahan cover tidak membatalkan outline atau persetujuan konten. Input maksimal 2 MB dan 16 megapiksel. Backend mendekode gambar, membatasi format ke JPEG/PNG, menghapus metadata dengan encoding ulang JPEG, dan memperkecil gambar sampai maksimal 480 x 720 piksel dengan rasio asli. Transparansi menjadi latar putih. Cover hasil maksimal 250 KB.

Cover disimpan sebagai data URL pada kolom `cover_image` agar gambar hanya dikirim melalui API ebook milik pengguna. Tidak memerlukan bucket publik, API Gemini, atau penyimpanan browser. Implementasi ini sesuai untuk cover kecil; daftar proyek ikut membawa data gambar, sehingga untuk koleksi besar sebaiknya beralih ke object storage privat dan thumbnail terpisah.

Jalankan `src/main/resources/db/V003__uploaded_covers.sql` setelah V001 dan V002 untuk database baru/lain. Migrasi memperluas kolom cover proyek dan publikasi menjadi text, mempertahankan URL lama. Migrasi ini sudah diterapkan pada database workspace saat implementasi. Restart backend untuk memuat endpoint dan batas multipart yang baru.

Pengujian integrasi mencakup upload gambar nyata, file palsu, isolasi pemilik, konflik revision, dan mempertahankan cover saat metadata diperbarui. Pengujian memakai H2; migrasi skema diverifikasi pada PostgreSQL workspace.

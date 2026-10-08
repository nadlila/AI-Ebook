# Demo ThinkerLab: Angular → Spring Boot → Supabase + Gemini

## Yang sudah dihubungkan

- Login/register Supabase, refresh token, token Bearer ke backend, role AUTHOR/READER dari database.
- Author membuat project dan menyimpan sumber referensi beserta kutipan isinya.
- Gemini menyusun outline berdasarkan tujuan belajar dan kutipan sumber; author menyetujui outline.
- Gemini membuat isi ebook; backend memvalidasi struktur, ID bab, dan ID sumber sebelum menyimpan versi.
- Editor mengubah teks, menyimpan versi, menjalankan pemeriksaan struktur, dan meminta konfirmasi review penulis sebelum publikasi.
- Reader melihat publikasi dan menyimpan posisi baca. Author dapat melihat pratinjau ebook miliknya.

API key Gemini hanya dibaca backend. Frontend mengambil URL Supabase dan **publishable key** melalui GET /api/config. Endpoint ini tidak mengembalikan password DB, key Gemini, atau secret/service-role key.

## Konfigurasi yang harus dilengkapi

Buka `backend/.env`. Pertahankan DB_URL, DB_USERNAME, DB_PASSWORD, SUPABASE_URL, CORS_ALLOWED_ORIGINS, PORT, dan GEMINI_API_KEY yang sudah ada. Tambahkan:

```dotenv
SUPABASE_PUBLISHABLE_KEY=sb_publishable_ISI_DARI_SUPABASE
GEMINI_MODEL=gemini-3.5-flash
```

Ambil **Publishable key** dari Supabase Dashboard → Settings → API Keys. Jangan gunakan secret key/service_role. Implementasi ini menerima key berawalan `sb_publishable_`. Jika yang tampil hanya legacy anon key, buka tab publishable keys. Jangan memasukkan key Gemini ke Angular.

Konfigurasi `.env` dibaca Spring sebagai properties, jadi nilai tidak perlu dibungkus tanda kutip. Setelah mengubah konfigurasi, restart backend. File `.env` harus tetap diabaikan Git.

## Menjalankan aplikasi

Terminal 1:

```sh
cd /Users/amandaardheliarahmandi/kuliah/magang/AI-Ebook/backend
./mvnw spring-boot:run
```

Bila wrapper belum dapat dijalankan, gunakan `bash mvnw spring-boot:run` atau `mvn spring-boot:run` jika Maven terpasang. Gunakan Java 21. Tunggu `Started BackendApplication` dan cek http://localhost:8080/api/health.

Terminal 2:

```sh
cd /Users/amandaardheliarahmandi/kuliah/magang/AI-Ebook/AI-ebook
npm ci
npm start
```

Buka http://localhost:4200. Jika npm mengalami error izin cache, gunakan `npm ci --cache /private/tmp/thinkerlab-npm-cache`.

## Urutan demo

1. Login dengan akun author yang sudah dibuat di Supabase. ID akun harus sama dengan ID pada `ebook_app.profiles` yang memiliki role AUTHOR.
2. Buat ebook, isi preferensi belajar. Untuk demo pertama pilih Short.
3. Tambahkan judul sumber, penerbit, URL, dan kutipan materi yang relevan. Pilih setidaknya satu sumber.
4. Isi tujuan dan hasil belajar, lanjutkan. Permintaan outline Gemini berjalan di tahap ini; tunggu sampai halaman outline terbuka.
5. Baca outline, klik approve. Tunggu Gemini membuat konten (bisa sampai 3 menit). Jangan menekan tombol berulang.
6. Setelah selesai, buka editor. Periksa dan ubah isi, lalu Save.
7. Pemeriksaan struktur harus lolos sebelum publikasi. Pemeriksaan ini **bukan** skor akurasi fakta atau plagiarisme.
8. Buka detail, Publish setelah benar-benar meninjau isi. Buka reader.
9. Untuk mencoba role reader, logout dan login dengan akun reader terpisah; publikasi tampil pada dashboard reader.

## Batas versi demo

- Sumber dimasukkan author; pencarian web otomatis belum tersedia.
- Pembuatan konten satu permintaan sinkron untuk seluruh ebook, belum antrean pekerjaan di server. Jika gagal, pesan error ditampilkan; data sebelumnya tidak diganti. Retry mencoba seluruh ebook yang belum memiliki konten.
- Generate/edit cover AI, upload cover, penghapusan ebook, dan alat rewrite per paragraf belum disambungkan; UI tidak menyimulasikan keberhasilannya.
- Pemeriksaan kualitas hanya struktural; author wajib memeriksa fakta dan sumber.
- Author preview belum mencatat posisi baca; pencatatan posisi tersedia pada reader publikasi.
- Listing versi demo mengambil maksimal 100 item dan dashboard menampilkan empat terbaru.
- Cache build Angular dinonaktifkan karena native cache mengalami crash pada Mac saat pengujian. Ini memengaruhi kecepatan build, bukan penyimpanan ebook.

## Validasi yang dijalankan

- 21 tes backend (otorisasi, lifecycle konten, JWT, dan endpoint AI dengan respons model terkontrol): lulus.
- Tes langsung Gemini dari Java: berhasil menghasilkan outline dengan format valid menggunakan gemini-3.5-flash.
- Build produksi Angular: berhasil, ada peringatan ukuran CSS komponen yang tidak memblokir build.
- Login browser dan alur penuh terhadap Supabase **belum terverifikasi**: SUPABASE_PUBLISHABLE_KEY belum tersedia saat pengujian. Tidak ada data demo yang dimasukkan ke database Supabase oleh proses pengujian ini.

Tes langsung Gemini bersifat opt-in memakai environment GEMINI_LIVE_KEY dan tidak berjalan saat tes rutin tanpa variabel tersebut.

# Pilihan provider AI

Untuk OpenAI, isi `backend/.env` lalu restart backend dari direktori `backend`:

```properties
AI_PROVIDER=openai
OPENAI_API_KEY=isi_key_asli_di_sini
OPENAI_MODEL=gpt-4.1-mini
```

OpenAI dipakai untuk outline dan isi ebook melalui Chat Completions dengan JSON mode.
Model dapat diganti sesuai akses project. Key hanya disimpan di backend; jangan commit `.env`.
Riset web tetap memakai Gemini Google Search; gunakan sumber manual jika hanya memakai key OpenAI.
Error OpenAI tidak otomatis dialihkan ke provider lain. Periksa billing dan limits jika menerima 429.
Dokumentasi: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create

## Mencoba OpenRouter tanpa menghapus Gemini

Konfigurasi Gemini dan key lama tetap disimpan di `.env`. Default `AI_PROVIDER=gemini`
mempertahankan perilaku sebelumnya. Jangan commit `.env` atau memasukkan key ke frontend.

Untuk mencoba OpenRouter, isi konfigurasi berikut di `backend/.env` lalu restart backend:

```properties
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=isi_key_asli_di_sini
OPENROUTER_MODEL=xingchen-agi/xing4.0-29b-a4b:free
```

ID model mengikuti model pilihan pengguna; ketersediaan dan kualitasnya perlu diuji langsung.
OpenRouter dipakai untuk outline dan isi ebook. Validasi struktur dan sumber tetap berlaku.
Jawaban terpotong atau JSON tidak valid ditolak; kegagalan tidak otomatis memakai key Gemini.
Model gratis memiliki batas pemakaian. Integrasi ini tidak menambahkan pencarian web berbayar.

Riset web tetap memakai Gemini Google Search dan `GEMINI_API_KEY`, terlepas dari
`AI_PROVIDER`. Jika tidak ingin memanggil Gemini sama sekali saat mencoba, gunakan sumber
manual dan hindari riset web otomatis. Capability `aiResearch` mengikuti konfigurasi Gemini,
sedangkan `aiGeneration` mengikuti provider yang dipilih. Konfigurasi tersedia belum menjamin
key, kuota, atau model valid.

Untuk kembali, ubah `AI_PROVIDER=gemini` lalu restart backend. Key OpenRouter boleh tetap
tersimpan; tidak digunakan untuk generasi saat Gemini dipilih.

Referensi: https://openrouter.ai/docs/quickstart

# Rujuk

Tanya jawab dokumen (RAG) dengan rujukan ke kutipan aslinya. Upload PDF/teks, tanya apa saja, dan tiap jawaban ada nomor sumber yang bisa diklik.

**Stack:** Next.js (App Router, TypeScript) · Supabase Postgres + pgvector · LLM dan embeddings bisa diganti lewat `.env.local`.

## Cara kerja

1. **Upload**: file dibaca (PDF pakai `unpdf`), dipotong jadi chunk ±650 karakter, tiap chunk di-embed lalu disimpan di Supabase.
2. **Tanya**: pertanyaan di-embed, `match_chunks` (SQL) ambil 4 chunk paling mirip.
3. **Jawab**: chunk dikirim ke LLM sebagai konteks, jawaban di-stream ke browser lengkap dengan nomor rujukan `[1]`, `[2]`.

## Setup

1. **Supabase**
   - Bikin project baru di [supabase.com](https://supabase.com).
   - Buka SQL Editor, paste isi `supabase/schema.sql`, klik Run.
   - Ambil `Project URL` dan `service_role` key di Project Settings > API.
2. **Environment**
   ```bash
   cp .env.example .env.local
   ```
   Isi `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, API key LLM, dan API key embeddings (lihat tabel di bawah).
3. **Jalankan**
   ```bash
   npm install
   npm run dev
   ```
   Buka http://localhost:3000, klik "Pakai dokumen contoh", lalu coba tanya "berapa batas klaim rawat jalan?".

Commit `package-lock.json` setelah `npm install` pertama supaya versi package terkunci.

## Ganti LLM / embeddings

Semua diatur di `.env.local`, tanpa ubah kode.

| Mau pakai | Isi |
|---|---|
| Claude | `LLM_PROVIDER=anthropic`, `LLM_MODEL=<nama model>`, `ANTHROPIC_API_KEY` |
| OpenAI | `LLM_PROVIDER=openai`, `LLM_MODEL=<nama model>`, `OPENAI_API_KEY` |
| Groq / OpenRouter / Ollama | `LLM_PROVIDER=openai` + `OPENAI_BASE_URL` (Ollama: `OPENAI_API_KEY` isi apa saja) |
| Embeddings OpenAI | `EMBEDDING_PROVIDER=openai`, `EMBEDDING_MODEL=text-embedding-3-small`, `EMBEDDING_API_KEY` |
| Embeddings Voyage | `EMBEDDING_PROVIDER=voyage`, `EMBEDDING_MODEL=<nama model>`, `VOYAGE_API_KEY` |

> **Penting:** angka `vector(1536)` di `supabase/schema.sql` harus sama dengan dimensi model embedding. Kalau ganti ke model dengan dimensi lain, ubah angkanya, buat ulang tabel `chunks`, lalu upload ulang dokumennya (vektor dari model yang beda tidak bisa dicampur).

### Nambah provider baru

1. Bikin file di `src/lib/llm/` (atau `src/lib/embeddings/`) yang ngikutin interface di `index.ts` (lihat `anthropic.ts` sebagai contoh).
2. Daftarin di `switch` pada `getLLM()` / `getEmbeddingProvider()`.
3. Tambah env-nya di `.env.example`.

## Struktur

```
src/
  app/
    page.tsx              halaman utama (upload <-> chat)
    api/documents/        GET list, POST upload, DELETE hapus
    api/chat/             retrieval + stream jawaban
  components/             Background, UploadBox, Chat
  lib/
    llm/                  provider LLM (anthropic, openai)
    embeddings/           provider embeddings (openai, voyage)
    chunk.ts  pdf.ts  prompt.ts  supabase.ts  env.ts  types.ts
supabase/schema.sql       tabel, index, fungsi pencarian
```

## Deploy (Vercel)

1. Push ke GitHub, import repo di Vercel.
2. Isi semua env dari `.env.local` di Project Settings > Environment Variables.
3. Deploy.

Catatan: batas ukuran upload di Vercel ±4,5 MB, dan upload PDF besar bisa kena batas waktu fungsi.

## Keamanan

- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server (folder `api/` dan `lib/`). Jangan dipakai di komponen browser dan jangan di-commit.
- App ini **belum punya login**. Siapa pun yang tahu URL-nya bisa upload dokumen dan menghabiskan kuota LLM-mu, dan semua dokumen terlihat oleh semua orang. Tambah auth (misal Supabase Auth) sebelum dibagikan ke publik.

## Ide pengembangan

- Login Supabase Auth + dokumen per user (kolom `user_id` + RLS).
- Rate limit di `/api/chat`.
- Hybrid search (vektor + full-text).
- Test untuk `chunk.ts`.
- Dukungan OCR buat PDF hasil scan.

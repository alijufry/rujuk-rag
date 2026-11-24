-- Jalankan sekali di Supabase: SQL Editor > New query > paste > Run
-- Ukuran vector (1536) harus sama dengan dimensi model embedding yang dipakai.
-- Kalau ganti model dengan dimensi lain, ubah angka 1536 di bawah (dan buat ulang tabelnya).

create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table chunks (
  id bigint generated always as identity primary key,
  document_id uuid not null references documents(id) on delete cascade,
  position int not null,
  content text not null,
  embedding vector(1536) not null
);

create index chunks_document_idx on chunks (document_id);
create index chunks_embedding_idx on chunks using hnsw (embedding vector_cosine_ops);

-- cari potongan yang paling mirip dengan pertanyaan
create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 4
)
returns table (
  id bigint,
  document_id uuid,
  document_name text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    d.name as document_name,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  join documents d on d.id = c.document_id
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- RLS nyala tanpa policy = cuma bisa diakses lewat service_role (dari server kita)
alter table documents enable row level security;
alter table chunks enable row level security;

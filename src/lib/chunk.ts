const TARGET_SIZE = 650; // batas kasar panjang satu chunk (karakter)
const MAX_PARAGRAPH = 900;
const OVERLAP = 100;

// cari titik potong yang enak (akhir kalimat) biar ga motong di tengah kata
function findCut(text: string, max: number) {
  const idx = text.lastIndexOf(". ", max);
  return idx > max / 2 ? idx + 1 : max;
}

export function chunkText(text: string): string[] {
  const paragraphs = text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (let para of paragraphs) {
    // paragraf kepanjangan (biasanya dari PDF) dipotong dulu
    while (para.length > MAX_PARAGRAPH) {
      const cut = findCut(para, 800);
      chunks.push(para.slice(0, cut).trim());
      para = para.slice(cut - OVERLAP).trim();
    }

    if (current && current.length + para.length > TARGET_SIZE) {
      chunks.push(current);
      current = para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

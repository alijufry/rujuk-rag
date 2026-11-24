export type Source = {
  n: number;
  documentName: string;
  content: string;
};

export type DocumentItem = {
  id: string;
  name: string;
  chunks: number;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// event yang dikirim /api/chat ke browser (satu JSON per baris)
export type StreamEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "text"; text: string }
  | { type: "error"; message: string };

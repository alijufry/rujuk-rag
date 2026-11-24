export function errorResponse(err: unknown, status = 500) {
  console.error(err);
  const message = err instanceof Error ? err.message : "Terjadi kesalahan";
  return Response.json({ error: message }, { status });
}

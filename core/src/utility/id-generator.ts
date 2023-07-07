export function generateStringId(length: number): string {
  const a = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(a);
  return Array.from(a, (d) => d.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, length);
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

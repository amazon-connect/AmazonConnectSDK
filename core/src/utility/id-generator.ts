export function generateStringId(length: number): string {
  var a = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(a);
  return Array.from(a, (d) => d.toString(16).padStart(2, "0")).join("");
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

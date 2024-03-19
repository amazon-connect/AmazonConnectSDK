export function generateStringId(length: number): string {
  const a = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(a);
  return Array.from(a, (d) => d.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, length);
}

export function generateUUID(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  } else {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
      const d = parseInt(c);
      return (
        d ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (d / 4)))
      ).toString(16);
    });
  }
}

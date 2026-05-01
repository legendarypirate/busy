export function defaultTripFormThankYouMn(settings: unknown): string {
  if (settings && typeof settings === "object" && "thankYouMn" in settings) {
    const v = (settings as { thankYouMn?: unknown }).thankYouMn;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "Таны бүртгэл амжилттай илгээгдлээ. Зохион байгуулагч таны мэдээллийг шалгаж баталгаажуулна.";
}

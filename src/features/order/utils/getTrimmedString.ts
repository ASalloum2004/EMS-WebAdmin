export function getTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

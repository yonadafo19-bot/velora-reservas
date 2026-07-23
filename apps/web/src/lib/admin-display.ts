export function operationalDisplayName(name: string) {
  return name.replace(/\bdemo\b/gi, "").replace(/\s{2,}/g, " ").trim();
}

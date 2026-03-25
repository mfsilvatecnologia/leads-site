export function withAffiliate(link: string, affiliateCode?: string) {
  if (!affiliateCode) return link;
  try {
    // Suporta links relativos e absolutos
    const url = new URL(link, window.location.origin);
    url.searchParams.set("a", affiliateCode);
    return url.pathname + url.search;
  } catch {
    // fallback para links tipo "#section" ou mal formatados
    if (link.includes("?")) {
      return link + `&a=${affiliateCode}`;
    } else {
      return link + `?a=${affiliateCode}`;
    }
  }
}

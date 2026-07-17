export function buildUrlset(urls) {
  const today = new Date().toISOString().slice(0, 10);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const entry of urls) {
    let url, lastmod;
    if (Array.isArray(entry)) {
      [url, lastmod] = entry;
      lastmod = lastmod && String(lastmod).length >= 10 ? String(lastmod).slice(0, 10) : today;
    } else {
      url = entry;
      lastmod = today;
    }
    xml += `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>\n`;
  }
  xml += '</urlset>';
  return xml;
}

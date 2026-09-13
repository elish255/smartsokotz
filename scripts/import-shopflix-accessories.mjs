import fs from 'node:fs/promises';
import path from 'node:path';

const CATEGORY_URL = 'https://shopflix.co.tz/category/mobile-phone-accessories-c5izn';
const PAGE_COUNT = 162;
const OUT = path.resolve('src/data/shopflix-accessories.json');
const CONCURRENCY = 5;

function clean(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function parsePage(html, page) {
  const products = [];
  const linkRe = /<a[^>]+href=["']([^"']*\/product\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links = [];
  let m;
  while ((m = linkRe.exec(html))) {
    const title = clean(m[2]);
    if (title && title.length > 3 && !links.some((x) => x.url === m[1])) links.push({ url: m[1], title });
  }

  const prices = [];
  const priceRe = /(?:TZS\s*([0-9][0-9,]*\.?[0-9]*)|([0-9][0-9,]*\.?[0-9]*)\s*TZS)/gi;
  while ((m = priceRe.exec(html))) {
    const raw = (m[1] || m[2]).replace(/,/g, '');
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) prices.push(value);
  }

  const n = Math.min(links.length, prices.length);
  for (let i = 0; i < n; i++) {
    products.push({ title: links[i].title, price: prices[i], currency: 'TZS', sourceUrl: new URL(links[i].url, CATEGORY_URL).href, sourcePage: page });
  }
  return products;
}

async function fetchPage(page) {
  const url = `${CATEGORY_URL}?page=${page}`;
  const response = await fetch(url, { headers: { 'user-agent': 'SmartSoko-Catalog-Sync/1.0' } });
  if (!response.ok) throw new Error(`page ${page}: HTTP ${response.status}`);
  return parsePage(await response.text(), page);
}

async function main() {
  const all = [];
  let cursor = 1;
  const worker = async () => {
    while (cursor <= PAGE_COUNT) {
      const page = cursor++;
      try {
        const products = await fetchPage(page);
        all.push(...products);
        console.log(`Shopflix page ${page}/${PAGE_COUNT}: ${products.length} products`);
      } catch (error) {
        console.warn(`Shopflix page ${page} skipped: ${error.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const unique = Array.from(new Map(all.map((p) => [p.sourceUrl, p])).values());
  unique.sort((a, b) => a.title.localeCompare(b.title));
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(unique, null, 2));
  console.log(`Saved ${unique.length} products to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

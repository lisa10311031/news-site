import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "news.json");

const PER_FEED = 8;
const RECENCY = "when:7d";

const LANGS = ["zh", "en", "ja"];
const LOCALES = {
  zh: { hl: "zh-TW", gl: "TW", ceid: "TW:zh-Hant" },
  en: { hl: "en-US", gl: "US", ceid: "US:en" },
  ja: { hl: "ja",    gl: "JP", ceid: "JP:ja" },
};

const CATEGORIES = [
  { id: "electronics", accent: "#0E8F86", labels: { zh: "電子零件",   en: "Electronic components", ja: "電子部品" } },
  { id: "politics",    accent: "#C0492F", labels: { zh: "政治",       en: "Politics",              ja: "政治" } },
  { id: "tech",        accent: "#3A5BD9", labels: { zh: "科技",       en: "Technology",            ja: "テクノロジー" } },
  { id: "finance",     accent: "#C08A1E", labels: { zh: "財經",       en: "Economy",               ja: "経済" } },
  { id: "world",       accent: "#2E8B57", labels: { zh: "國際",       en: "World",                 ja: "国際" } },
  { id: "supplychain", accent: "#7A4FC0", labels: { zh: "供應鏈",     en: "Supply chain",          ja: "サプライチェーン" } },
  { id: "health",      accent: "#C0507A", labels: { zh: "健康醫療",   en: "Health",                ja: "健康 医療" } },
];

function feedUrl(term, loc) {
  const q = encodeURIComponent(`${term} ${RECENCY}`);
  return `https://news.google.com/rss/search?q=${q}&hl=${loc.hl}&gl=${loc.gl}&ceid=${loc.ceid}`;
}

function decode(s) {
  return (s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&amp;/g, "&");
}
const stripTags = (s) => (s || "").replace(/<[^>]*>/g, " ");

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1].trim() : "";
}

function parseRss(xml) {
  const out = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    let title = decode(tag(b, "title")).trim();
    const link = decode(tag(b, "link")).trim();
    const pub = tag(b, "pubDate");
    let source = decode(stripTags(tag(b, "source"))).trim();
    if (source && title.endsWith(" - " + source)) {
      title = title.slice(0, -(source.length + 3)).trim();
    } else {
      const i = title.lastIndexOf(" - ");
      if (i > 0 && title.length - i < 60) {
        if (!source) source = title.slice(i + 3).trim();
        title = title.slice(0, i).trim();
      }
    }
    let desc = decode(stripTags(decode(tag(b, "description")))).replace(/\s+/g, " ").trim();
    let summary = "";
    if (desc && desc.length > 60 && !title.startsWith(desc.slice(0, 18)) && !desc.startsWith(title.slice(0, 18))) {
      summary = desc.length > 200 ? desc.slice(0, 200) + "…" : desc;
    }
    let date = "";
    if (pub) { const d = new Date(pub); if (!isNaN(d)) date = d.toISOString().slice(0, 10); }
    if (title) out.push({ title, summary, source, url: link, date });
  }
  const seen = new Set();
  return out.filter((it) => {
    const k = it.title.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, PER_FEED);
}

async function fetchFeed(term, loc) {
  const res = await fetch(feedUrl(term, loc), {
    headers: { "user-agent": "Mozilla/5.0 (compatible; news-aggregator)" },
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return parseRss(await res.text());
}

const previous = {};
try {
  const old = JSON.parse(readFileSync(OUT, "utf8"));
  for (const c of old.categories || []) previous[c.id] = c.items || {};
} catch {}

const out = { generatedAt: new Date().toISOString(), languages: LANGS, categories: [] };

for (const cat of CATEGORIES) {
  const items = {};
  for (const lng of LANGS) {
    process.stdout.write(`抓取「${cat.labels.zh}」/${lng}… `);
    try {
      const list = await fetchFeed(cat.labels[lng], LOCALES[lng]);
      items[lng] = list;
      console.log(`${list.length} 則`);
    } catch (e) {
      items[lng] = (previous[cat.id] && previous[cat.id][lng]) || [];
      console.log(`失敗，沿用舊資料（${items[lng].length} 則）— ${String(e.message).slice(0, 80)}`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  out.categories.push({ id: cat.id, accent: cat.accent, labels: cat.labels, items });
}

writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`\n已寫入 ${OUT}`);

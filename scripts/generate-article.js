const GEMINI_KEY = process.env.GEMINI_API_KEY;
const AMAZON_TAG = 'marinaveauv04-20';
const ADSENSE_ID = 'ca-pub-9764757165289980';
const SITE_NAME = 'AI Real Estate Hub';
const SITE_COLOR = '#e94560';
const fs = require('fs');
const path = require('path');

const TOPICS = [
  "Best AI Tools for Real Estate Agents 2026",
  "AI Property Valuation Tools: Accurate Home Pricing",
  "How to Use ChatGPT for Real Estate Marketing",
  "Best AI CRM Tools for Realtors",
  "AI Virtual Staging: Best Tools and Honest Reviews",
  "How AI Is Changing Real Estate Lead Generation",
  "Best AI Tools for Property Management 2026",
  "AI-Powered Real Estate Photography and Editing Tools",
  "How to Automate Real Estate Email Marketing with AI",
  "Best AI Chatbots for Real Estate Websites",
  "AI Tools for Real Estate Market Analysis",
  "How to Write Better Property Listings with AI",
  "Best AI Tools for Mortgage Brokers and Lenders",
  "AI for Commercial Real Estate: Investment Analysis Tools",
  "How Real Estate Agents Can Use AI to Close More Deals"
];

async function generateArticle(topic) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `You are an expert reviewer. Write a 2000-3000 word article about: ${topic}. Include practical comparisons, pricing, pros/cons. Include 2-3 Amazon affiliate links: https://www.amazon.com/dp/{ASIN}?tag=${AMAZON_TAG}. Use ASINs: 0593418484 (Atomic Habits), 0062960067 (AI Superpowers), 1591847818 (Hard Thing About Hard Things). HTML only (H2,H3,tables,lists,p). No html/head/body tags. JSON response: {"title":"...","slug":"...","excerpt":"...","content":"..."}` }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 8192, responseMimeType: 'application/json', responseSchema: { type: 'object', properties: { title: { type: 'string' }, slug: { type: 'string' }, excerpt: { type: 'string' }, content: { type: 'string' } }, required: ['title','slug','excerpt','content'] } },
    }),
  });
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini empty');
  return JSON.parse(text);
}

function buildHTML(article) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${article.title} — ${SITE_NAME}</title><meta name="description" content="${article.excerpt}"><meta name="google-adsense-account" content="${ADSENSE_ID}"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}" crossorigin="anonymous"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#0f0f1a;color:#d0d0d0;line-height:1.8}.container{max-width:780px;margin:0 auto;padding:40px 20px}a{color:${SITE_COLOR}}h1{font-size:36px;font-weight:800;color:#fff;margin-bottom:16px;line-height:1.2}h2{font-size:24px;font-weight:700;color:#fff;margin:32px 0 12px;padding-top:16px;border-top:1px solid #222}h3{font-size:18px;font-weight:600;color:#e0e0e0;margin:20px 0 8px}p{margin-bottom:16px}ul,ol{margin:0 0 16px 24px}li{margin-bottom:6px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:10px 14px;border:1px solid #222;text-align:left;font-size:14px}th{background:#1a1a2e;color:#fff;font-weight:600}td{background:#111122}.meta{color:#666;font-size:13px;margin-bottom:24px}.back{display:inline-block;color:${SITE_COLOR};text-decoration:none;font-size:14px;margin-bottom:20px}.affiliate-note{background:#1a1a2e;padding:12px 16px;border-radius:8px;font-size:12px;color:#666;margin-top:40px;border-left:3px solid ${SITE_COLOR}}footer{text-align:center;padding:40px 20px;color:#444;font-size:12px}</style></head><body><div class="container"><a href="../index.html" class="back">&larr; Back to ${SITE_NAME}</a><h1>${article.title}</h1><div class="meta">Updated ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} • ${SITE_NAME}</div>${article.content}<div class="affiliate-note"><strong>Disclosure:</strong> Some links are affiliate links. We may earn a commission at no extra cost to you.</div></div><footer>${SITE_NAME} &copy; 2026</footer></body></html>`;
}

function updateIndex(articles) {
  const indexPath = path.join(__dirname,'..','index.html');
  let idx = fs.readFileSync(indexPath,'utf8');
  const cards = articles.map(a => `<div class="article-card"><span class="tag">Review</span><h3><a href="articles/${a.slug}.html">${a.title}</a></h3><p>${a.excerpt}</p><div class="meta">${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div></div>`).join('\n');
  idx = idx.replace(/<div class="article-grid" id="article-grid">[\s\S]*?<\/div>\s*<\/section>/,`<div class="article-grid" id="article-grid">\n${cards}\n</div>\n</section>`);
  fs.writeFileSync(indexPath, idx);
}

(async () => {
  const count = parseInt(process.env.ARTICLE_COUNT || '3');
  const articlesDir = path.join(__dirname,'..','articles');
  if (!fs.existsSync(articlesDir)) fs.mkdirSync(articlesDir,{recursive:true});
  const existing = fs.readdirSync(articlesDir).filter(f=>f.endsWith('.html')).map(f=>f.replace('.html',''));
  const available = TOPICS.filter(t => !existing.some(e => t.toLowerCase().includes(e.replace(/-/g,' ').substring(0,20))));
  const published = [];
  for (let i = 0; i < Math.min(count, available.length); i++) {
    console.log(`[${i+1}/${count}] ${available[i]}`);
    try {
      const article = await generateArticle(available[i]);
      fs.writeFileSync(path.join(articlesDir, article.slug + '.html'), buildHTML(article));
      console.log('  ✅ ' + article.slug);
      published.push(article);
    } catch (err) { console.error('  ❌ ' + err.message); }
    if (i < count - 1) await new Promise(r => setTimeout(r, 3000));
  }
  const all = fs.readdirSync(articlesDir).filter(f=>f.endsWith('.html')).map(f => {
    const c = fs.readFileSync(path.join(articlesDir,f),'utf8');
    const t = c.match(/<title>(.*?) —/); const d = c.match(/content="(.*?)">/);
    return t ? { title: t[1], slug: f.replace('.html',''), excerpt: d?d[1]:'' } : null;
  }).filter(Boolean);
  if (all.length) updateIndex(all);
  console.log('📊 ' + published.length + '/' + count + ' published. Total: ' + all.length);
})();

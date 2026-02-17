const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3210;

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function classifyType(title = '', extra = '') {
  const t = `${title} ${extra}`.toLowerCase();
  const has = (...w) => w.some(x => t.includes(x));
  if (has('programming','software','code','algorithm','machine learning','ai','data','java','python','devops','cloud')) return 'Technical';
  if (has('history','biography','memoir','economics','finance','business','politics','psychology','self-help','philosophy','science')) return 'Non-fiction';
  if (has('novel','fiction','romance','fantasy','thriller','mystery','poetry','literature','classic')) return 'Literature';
  return 'General';
}

function defaultResume(title, type) {
  return [
    `After reading "${title}", I learned to focus on one core principle and apply it consistently.`,
    'I learned that progress comes from small repeatable actions, not one-time motivation.',
    type === 'Technical'
      ? 'I learned to translate ideas into a simple system I can test, measure, and improve.'
      : 'I learned to reflect on the story/ideas and turn them into concrete decisions in daily life.'
  ];
}

function splitSentences(text = '') {
  return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}

async function buildResume(workKey, title, type) {
  try {
    const r = await fetch(`https://openlibrary.org${workKey}.json`);
    const body = await r.json();
    const desc = typeof body.description === 'string'
      ? body.description
      : body.description?.value;

    const points = [];
    if (desc) {
      for (const s of splitSentences(String(desc))) {
        if (s.length > 35) {
          points.push(`After reading it, I learned: ${s.slice(0, 220)}`);
          if (points.length >= 2) break;
        }
      }
    }

    if (Array.isArray(body.subjects) && body.subjects.length) {
      points.push(`My key themes from the book are: ${body.subjects.slice(0,4).join(', ')}.`);
    }

    const fallback = defaultResume(title, type);
    while (points.length < 3) points.push(fallback[points.length]);
    return points.slice(0, 3);
  } catch {
    return defaultResume(title, type);
  }
}

async function normalizeItems(items) {
  const out = [];
  for (const item of items) {
    if (out.length >= 10) break;
    const key = item.key;
    const title = item.title;
    const author = Array.isArray(item.author_name) ? item.author_name[0] : item.author_name;
    const cover = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : '';
    if (!key || !title || !author) continue;

    const workKey = key.startsWith('/works/') ? key : key.replace('/books/', '/works/');
    const type = classifyType(title, JSON.stringify(item));
    const resume = await buildResume(workKey, title, type);

    out.push({
      rank: out.length + 1,
      title,
      author,
      type,
      link: `https://openlibrary.org${workKey}`,
      coverUrl: cover,
      resume
    });
  }
  return out;
}

async function getTrending() {
  const r = await fetch('https://openlibrary.org/trending/daily.json');
  const j = await r.json();
  return normalizeItems(j.works || []);
}

async function searchTopic(q) {
  const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10`);
  const j = await r.json();
  return normalizeItems(j.docs || []);
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);

  if (u.pathname === '/api/trending') {
    try { return sendJson(res, 200, await getTrending()); }
    catch (e) { return sendJson(res, 500, { error: String(e) }); }
  }

  if (u.pathname === '/api/search') {
    const q = (u.searchParams.get('q') || '').trim();
    if (!q) return sendJson(res, 400, { error: 'Missing q' });
    try { return sendJson(res, 200, await searchTopic(q)); }
    catch (e) { return sendJson(res, 500, { error: String(e) }); }
  }

  const file = u.pathname === '/' ? '/index.html' : u.pathname;
  const full = path.join(__dirname, 'public', file);
  if (!full.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(full);
    const map = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
    res.writeHead(200, { 'Content-Type': `${map[ext] || 'text/plain'}; charset=utf-8` });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Books Node app running at http://127.0.0.1:${PORT}`);
});

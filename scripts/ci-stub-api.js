// Tiny stand-in for the API so `next build` in CI never touches production. Build-time pages
// and sitemaps fetch data, and against the live API those requests are large and slow.
const http = require('http');

const PORT = process.env.PORT || 4599;
const city = { id: 'c1', name: 'Ahmedabad', slug: 'ahmedabad' };

http.createServer((req, res) => {
  const path = new URL(req.url, 'http://stub').pathname.replace('/api/v1', '');
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (path === '/cities') return send(200, [city]);
  if (path === '/properties') return send(200, { properties: [], total: 0 });
  if (path === '/blog') return send(200, { posts: [] });
  if (path === '/site-settings') return send(200, {});
  return send(200, []);
}).listen(PORT, '127.0.0.1', () => console.log(`stub API on port ${PORT}`));

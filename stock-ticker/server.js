// 실시간 주가 프록시 서버 (의존성 없음, Node 18+)
// 브라우저는 CORS 때문에 네이버 증권 API를 직접 호출할 수 없으므로
// 이 서버가 대신 받아와서 public/index.html 에 JSON으로 넘겨준다.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MOCK = process.env.MOCK === '1';
const CACHE_MS = 2000;

const STOCKS = ['005930', '000660']; // 삼성전자, SK하이닉스
const INDICES = ['KOSPI', 'KOSDAQ'];
const NAVER = 'https://polling.finance.naver.com/api/realtime/domestic';

const num = (v) => (v == null ? null : Number(String(v).replace(/,/g, '')));

function normalize(d, type) {
  return {
    type,
    code: d.itemCode,
    name: d.stockName,
    price: num(d.closePrice),
    change: num(d.compareToPreviousClosePrice),
    rate: num(d.fluctuationsRatio),
    direction: d.compareToPreviousPrice && d.compareToPreviousPrice.name, // RISING, FALLING, EVEN, UPPER_LIMIT, LOWER_LIMIT
    marketStatus: d.marketStatus, // OPEN, CLOSE, PREOPEN ...
    tradedAt: d.localTradedAt || null,
  };
}

async function fetchNaver(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://finance.naver.com/' } });
  if (!res.ok) throw new Error(`Naver ${res.status} ${url}`);
  return (await res.json()).datas || [];
}

// 네이버에 접속할 수 없는 환경에서 화면을 확인하기 위한 가짜 데이터
const mockBase = {
  '005930': ['삼성전자', 'stock', 71000], '000660': ['SK하이닉스', 'stock', 198000],
  KOSPI: ['코스피', 'index', 2600], KOSDAQ: ['코스닥', 'index', 850],
};
function mockQuotes() {
  return Object.entries(mockBase).map(([code, [name, type, prev]]) => {
    const rate = Math.round((Math.random() * 6 - 3) * 100) / 100;
    const price = type === 'index' ? Math.round(prev * (1 + rate / 100) * 100) / 100 : Math.round(prev * (1 + rate / 100) / 100) * 100;
    const change = Math.round((price - prev) * 100) / 100;
    return { type, code, name, price, change, rate, direction: change > 0 ? 'RISING' : change < 0 ? 'FALLING' : 'EVEN', marketStatus: 'MOCK', tradedAt: new Date().toISOString() };
  });
}

let cache = { at: 0, body: null };
async function getQuotes() {
  if (Date.now() - cache.at < CACHE_MS && cache.body) return cache.body;
  let quotes;
  if (MOCK) {
    quotes = mockQuotes();
  } else {
    const [stocks, ...indices] = await Promise.all([
      fetchNaver(`${NAVER}/stock/${STOCKS.join(',')}`),
      ...INDICES.map((c) => fetchNaver(`${NAVER}/index/${c}`)),
    ]);
    quotes = [...stocks.map((d) => normalize(d, 'stock')), ...indices.flat().map((d) => normalize(d, 'index'))];
  }
  cache = { at: Date.now(), body: JSON.stringify({ updatedAt: new Date().toISOString(), quotes }) };
  return cache.body;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/quotes') {
    try {
      const body = await getQuotes();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch (e) {
      console.error(e.message);
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(__dirname, 'public', 'index.html')).pipe(res);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
}).listen(PORT, () => console.log(`http://localhost:${PORT} ${MOCK ? '(MOCK 데이터)' : '(네이버 증권 실시간)'}`));

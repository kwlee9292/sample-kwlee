# 실시간 시세 (삼성전자 · SK하이닉스 · 코스피 · 코스닥)

네이버 증권의 공개 폴링 API(`polling.finance.naver.com`)에서 시세를 받아 5초마다 화면에 표시합니다.
무료이고 API 키가 필요 없습니다.

## 가장 쉬운 방법: stock.html 더블클릭

`stock.html`을 다운로드해서 더블클릭하면 브라우저에서 바로 열립니다. 서버도 설치도 필요 없습니다.
무료 공개 CORS 프록시(corsproxy.io 등)를 거쳐 가져오는 방식이라, 프록시가 느리거나 막히면 "불러오기 실패"가 뜰 수 있습니다. 그럴 땐 아래 서버 방식을 쓰세요.

## 실행 (서버 방식, 더 안정적)

Node.js 18 이상만 있으면 됩니다 (설치할 패키지 없음).

```bash
cd stock-ticker
node server.js
# → http://localhost:3000 접속
```

네이버에 접속이 안 되는 환경에서 화면만 확인하려면 `MOCK=1 node server.js`.

## 왜 서버가 필요한가?

네이버·토스·알파스퀘어 같은 사이트는 다른 도메인의 웹페이지가 자기 API를 호출하는 것을 막습니다(CORS).
그래서 HTML에서 바로 `fetch('https://polling.finance.naver.com/...')` 하면 브라우저가 차단합니다.
`server.js`가 중간에서 대신 받아와 `/api/quotes`로 넘겨주는 구조입니다.

```
브라우저(index.html) --5초마다--> server.js /api/quotes --> 네이버 증권 API
```

## 종목 추가

`server.js`의 `STOCKS` 배열에 종목코드(예: `'035420'` 네이버)를 추가하고,
`public/index.html`의 `ORDER`에도 넣으면 표시 순서가 정해집니다.

## 주의

- 공식 API가 아니라 네이버 웹페이지가 쓰는 내부 API라 예고 없이 바뀌거나 막힐 수 있습니다. 개인 용도로만 쓰세요.
- 너무 자주 호출하지 않도록 서버에서 2초 캐시를 둡니다.
- 안정적인 공식 데이터가 필요하면 한국투자증권 KIS Developers(무료, 계좌 필요, 웹소켓 실시간 체결) 같은 증권사 Open API를 쓰는 게 정석입니다.

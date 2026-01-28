# 금융 대시보드 - 백엔드 API 서버

Express + TypeScript 기반 금융 데이터 REST API 서버입니다.

## 🚀 시작하기

### 설치
```bash
npm install
```

### 개발 모드 실행
```bash
npm run dev
```
서버가 `http://localhost:3001`에서 실행됩니다.

## ☁️ Netlify Functions 배포(서버리스) 가정

이 백엔드는 **Netlify Functions**로도 동작하도록 구성되어 있습니다.

- **함수 위치**: `netlify/functions/*`
- **리라이트 설정**: `netlify.toml` (기존 `/api/*` 경로 유지)

Netlify 배포 시에는 Express 서버(`src/index.ts`)를 상시 실행하는 방식이 아니라,
각 엔드포인트가 **서버리스 함수**로 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
npm start
```

## 📡 API 엔드포인트

### 헬스체크
```
GET /health
```

**응답 예시:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-28T04:30:00.000Z"
}
```

---

### 환율 조회
```
GET /api/exchange-rate/:pair?period=1day
```

**파라미터:**
- `pair` (필수): `USD/KRW` 또는 `JPY/KRW`
- `period` (선택): `1day`, `1week`, `1month`, `6month`, `1year` (기본값: `1day`)

**예시:**
```bash
curl http://localhost:3001/api/exchange-rate/USD/KRW?period=1week
```

**응답:**
```json
{
  "current": 1320.50,
  "change24h": 0.45,
  "history": [
    { "timestamp": 1706428800000, "value": 1318.20 },
    { "timestamp": 1706432400000, "value": 1320.50 }
  ]
}
```

---

### 금시세 조회
```
GET /api/gold?period=1day
```

**파라미터:**
- `period` (선택): `1day`, `1week`, `1month`, `6month`, `1year`

**예시:**
```bash
curl http://localhost:3001/api/gold?period=1month
```

**응답:**
```json
{
  "current": 416250.00,
  "change24h": -0.15,
  "history": [
    { "timestamp": 1706428800000, "value": 415000.00 },
    { "timestamp": 1706432400000, "value": 416250.00 }
  ]
}
```

**참고:** 금시세는 3.75그램 (1돈) 기준입니다.

---

### 가상화폐 시세 조회
```
GET /api/crypto/:symbol?period=1day
```

**파라미터:**
- `symbol` (필수): `BTC`, `ETH`, `XRP`
- `period` (선택): `1day`, `1week`, `1month`, `6month`, `1year`

**예시:**
```bash
curl http://localhost:3001/api/crypto/BTC?period=1day
```

**응답:**
```json
{
  "current": 134500000,
  "change24h": 2.35,
  "history": [
    { "timestamp": 1706428800000, "value": 131500000 },
    { "timestamp": 1706432400000, "value": 134500000 }
  ]
}
```

---

### S&P 500 지수 조회
```
GET /api/sp500?period=1day
```

**파라미터:**
- `period` (선택): `1day`, `1week`, `1month`, `6month`, `1year`

**예시:**
```bash
curl http://localhost:3001/api/sp500?period=1year
```

**응답:**
```json
{
  "current": 5850.25,
  "change24h": 0.45,
  "history": [
    { "timestamp": 1706428800000, "value": 5820.00 },
    { "timestamp": 1706432400000, "value": 5850.25 }
  ]
}
```

---

### 전체 데이터 조회 (통합)
```
GET /api/all?period=1day
```

**파라미터:**
- `period` (선택): `1day`, `1week`, `1month`, `6month`, `1year`

**예시:**
```bash
curl http://localhost:3001/api/all?period=1day
```

**응답:**
```json
{
  "exchangeRates": {
    "usdKrw": {
      "current": 1320.50,
      "change24h": 0.45,
      "history": [...]
    },
    "jpyKrw": {
      "current": 8.91,
      "change24h": -0.12,
      "history": [...]
    }
  },
  "gold": {
    "current": 416250.00,
    "change24h": -0.15,
    "history": [...]
  },
  "crypto": {
    "btc": {
      "current": 134500000,
      "change24h": 2.35,
      "history": [...]
    },
    "eth": {
      "current": 4250000,
      "change24h": 1.80,
      "history": [...]
    },
    "xrp": {
      "current": 850,
      "change24h": 3.20,
      "history": [...]
    }
  },
  "sp500": {
    "current": 5850.25,
    "change24h": 0.45,
    "history": [...]
  }
}
```

---

## 🛠️ 기술 스택

- **Node.js** + **Express**: 웹 서버 프레임워크
- **TypeScript**: 타입 안정성
- **CORS**: Cross-Origin Resource Sharing
- **node-cache**: 메모리 캐싱 (5분 TTL)

## 📦 외부 API

### 1. 환율 데이터
- **API**: Open Exchange Rates API
- **URL**: https://open.er-api.com/v6/latest/USD
- **제한**: 무료 티어 - 월 1,500 요청

### 2. 가상화폐 및 금시세
- **API**: CoinGecko API
- **URL**: https://api.coingecko.com/api/v3/simple/price
- **제한**: 무료 티어 - 분당 10-50 요청

### 3. S&P 500 지수
- **API**: Yahoo Finance (비공식)
- **URL**: https://query1.finance.yahoo.com/v8/finance/chart/^GSPC
- **제한**: 비공식 API, 제한 불명확

## ⚡ 성능 최적화

### 캐싱 전략
- 모든 API 응답을 5분간 캐시
- `node-cache` 사용으로 메모리 기반 캐싱
- 동일 요청 시 외부 API 호출 없이 캐시에서 응답

**캐시 키 형식:**
```
exchange-USD/KRW-1day
exchange-JPY/KRW-1week
gold-1month
crypto-BTC-1day
sp500-1year
```

### 동시 요청 처리
- `/api/all` 엔드포인트는 `Promise.all`로 병렬 처리
- 7개 데이터를 동시에 조회하여 응답 속도 향상

## 🔧 환경 설정

### 포트 변경
`src/index.ts` 파일에서 포트 변경 가능:
```typescript
const PORT = 3001; // 원하는 포트로 변경
```

### CORS 설정
현재 모든 오리진 허용 (개발 환경용):
```typescript
app.use(cors());
```

프로덕션에서는 특정 도메인만 허용:
```typescript
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── index.ts              # Express 서버 설정 및 라우트
│   └── services/
│       └── financeService.ts # 금융 데이터 조회 로직
├── dist/                     # 빌드 결과물 (TypeScript → JavaScript)
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 디버깅

### 로그 확인
서버 콘솔에서 다음과 같은 로그 확인 가능:
```
🚀 금융 데이터 API 서버가 http://localhost:3001 에서 실행중입니다
환율 조회 실패: Error: ...
```

### 외부 API 테스트
```bash
# 환율 API 테스트
curl https://open.er-api.com/v6/latest/USD

# 가상화폐 API 테스트
curl "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=krw&include_24hr_change=true"
```

## 🚨 에러 처리

모든 엔드포인트는 다음 형식의 에러 응답 반환:
```json
{
  "error": "환율 정보를 가져올 수 없습니다"
}
```

**HTTP 상태 코드:**
- `200`: 성공
- `500`: 서버 오류 (외부 API 실패, 네트워크 오류 등)

## 📈 히스토리 데이터

현재 히스토리 데이터는 **시뮬레이션**으로 생성됩니다:
- 현재 가격을 기준으로 랜덤 변동성 추가 (±5%)
- 실제 과거 데이터가 아닌 데모용 데이터

**실제 과거 데이터가 필요한 경우:**
- CoinGecko의 `/coins/{id}/market_chart` 엔드포인트 사용 (가상화폐)
- Alpha Vantage API 사용 (환율, 주식)
- 유료 금융 데이터 API 사용

## 🔐 보안 권장사항

프로덕션 배포 시:
1. 환경 변수로 API 키 관리 (`.env` 파일)
2. Rate limiting 추가 (express-rate-limit)
3. Helmet.js로 HTTP 헤더 보안 강화
4. HTTPS 사용
5. CORS를 특정 도메인으로 제한

## 📝 라이선스

MIT License

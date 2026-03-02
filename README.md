# Travel Route Planner PWA

가고 싶은 장소를 리스트업하고, 최적 경로 순서를 정한 뒤 구간별 대중교통/택시 시간·비용을 보여주는 PWA입니다. 휴대폰 홈화면에 추가할 수 있습니다.

## 기능

1. **장소 리스트** - Google Places API로 장소 검색 후 추가 (순서 무관)
2. **최적 경로** - TSP 근사(Nearest Neighbor + 2-opt)로 방문 순서 최적화
3. **구간별 시간/비용** - 각 구간마다 대중교통·택시 두 옵션으로 표시
4. **PWA** - `display: standalone`, 홈화면 추가 지원

## 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. **Places API**, **Directions API**, **Geocoding API**, **Routes API** 활성화
3. API 키 생성 후 `.env` 파일 생성:

```
VITE_GOOGLE_MAPS_API_KEY=your_api_key
```

4. 패키지 설치 및 실행:

```bash
npm install
npm run dev
```

5. 빌드 및 프리뷰 (PWA 테스트):

```bash
npm run build
npm run preview
```

HTTPS 또는 localhost에서 "홈화면에 추가"가 동작합니다.

## CORS

Google Places/Directions REST API는 브라우저에서 직접 호출 시 CORS 제한이 있을 수 있습니다. API 키에 HTTP 리퍼러 제한을 두면 제한이 완화될 수 있습니다. 문제가 있으면 Vite proxy로 백엔드 프록시를 구성하세요.

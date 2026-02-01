# 카톡 답장 도우미 (message-agent)

Upstage API를 활용한 MZ세대 직장인을 위한 카톡 답장 추천 서비스

## 🚀 Vercel 배포 방법

### 1. 파일 구조 확인
```
project-root/
├── api/
│   ├── chat.py      # 텍스트 메시지 처리 API
│   └── ocr.py       # 이미지 OCR + 답장 생성 API
├── index.html       # 메인 웹 페이지
├── logo.png         # Upstage 로고
├── vercel.json      # Vercel 설정 파일
└── requirements.txt # Python 의존성 (비어있어도 됨)
```

### 2. Vercel CLI 설치 및 로그인
```bash
npm install -g vercel
vercel login
```

### 3. 프로젝트 배포
```bash
# 프로젝트 디렉토리에서
vercel

# 프로덕션 배포
vercel --prod
```

### 4. Vercel 대시보드에서 배포
1. https://vercel.com 에서 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결 또는 파일 직접 업로드
4. 배포 완료!

## 🔑 API 키 설정

현재 코드에 하드코딩된 API 키를 환경변수로 변경하는 것을 권장합니다:

1. Vercel 대시보드에서 프로젝트 선택
2. Settings → Environment Variables
3. `UPSTAGE_API_KEY` 추가

그리고 코드에서:
```python
import os
API_KEY = os.getenv('UPSTAGE_API_KEY', 'your-default-key')
```

## 📁 주요 파일 설명

### `api/chat.py`
- 텍스트 메시지를 받아 답장 추천
- Upstage Solar-Pro 모델 사용
- 3가지 톤 지원: 공손(polite), 중립(neutral), 적극적(active)

### `api/ocr.py`
- 카톡 캡쳐 이미지 업로드
- Upstage OCR로 텍스트 추출
- 추출된 텍스트 기반 답장 추천

### `vercel.json`
- Vercel 배포 설정
- Python 런타임 지정
- API 라우팅 설정

## 🎨 기능

- ✅ 텍스트 입력으로 답장 추천
- ✅ 카톡 캡쳐 이미지 OCR 분석
- ✅ 3가지 톤(말투) 선택
- ✅ Ctrl+V 이미지 붙여넣기
- ✅ 드래그 앤 드롭 이미지 업로드
- ✅ 반응형 디자인

## 🛠️ 기술 스택

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Python (Vercel Serverless Functions)
- **AI**: Upstage Solar-Pro, Document Digitization OCR
- **Deployment**: Vercel

## 📝 문제 해결

### 404 NOT_FOUND 오류
- `api/` 폴더가 프로젝트 루트에 있는지 확인
- `vercel.json` 파일이 올바른지 확인
- 파일 이름이 정확한지 확인 (`chat.py`, `ocr.py`)

### CORS 오류
- 각 API 함수에 CORS 헤더가 포함되어 있음
- `do_OPTIONS` 메서드가 구현되어 있음

### API 응답 없음
- Vercel 로그 확인: `vercel logs [deployment-url]`
- Upstage API 키가 유효한지 확인
- API 호출 제한 확인

## 📞 지원

문제가 있으시면:
1. Vercel 로그 확인
2. 브라우저 개발자 도구 콘솔 확인
3. Upstage API 문서 참고: https://console.upstage.ai/docs

---

Powered by **Upstage AI** 🚀

# 🖥️ DevPortfolio — 프론트엔드

> DevPortfolio 프론트엔드 레포입니다.
> 전체 프로젝트 소개 및 기술 스택은 백엔드 레포를 참고해주세요.

🔗 **백엔드 레포 (메인 README):** [devportfolio_backend](https://github.com/PARK-DONGMIN/devportfolio_backend)
🌐 **배포 주소:** https://dgqvp2xdbjhrc.cloudfront.net

---

## 🛠 기술 스택

| 분류 | 기술 |
|------|------| 
| Framework | React 19 / React Router 7 |
| 에디터 | Tiptap |
| HTTP | Axios |
| 실시간 | @stomp/stompjs + SockJS |
| 배포 | AWS S3 + CloudFront |

---

## ⚙️ 실행 방법

### 환경변수 설정

`.env` 파일을 생성하고 아래 내용을 입력하세요.

```
REACT_APP_API_URL=http://localhost:8080
```

### 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 프로덕션 빌드
npm run build
```

---

## 📁 프로젝트 구조

```
src/
├── api/          # Axios API 호출 모듈
├── components/   # 공통 컴포넌트 (Navbar, RichEditor 등)
├── context/      # AuthContext, ThemeContext, ToastContext
├── hooks/        # useNotificationSocket
└── pages/        # 페이지 컴포넌트
    ├── LoginPage
    ├── PortfolioListPage
    ├── PortfolioDetailPage
    ├── PortfolioFormPage
    ├── ProfilePage
    └── TemplateListPage
```

---

## 👨‍💻 개발자

| 항목 | 내용 |
|------|------|
| 이름 | 박동민 |
| 이메일 | pdm6547@naver.com |
| GitHub | [@PARK-DONGMIN](https://github.com/PARK-DONGMIN) |

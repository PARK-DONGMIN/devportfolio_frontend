# CLAUDE.md — DevPortfolio Frontend

## 프로젝트 개요
개발자 포트폴리오 공유 서비스의 React 프론트엔드.
Spring Boot 백엔드와 JWT 인증으로 연동. 포트폴리오 CRUD, 댓글, 좋아요, 조회수, 알림, 템플릿, 프로필 기능 제공.

## 기술 스택
- React 19, React Router 7
- Axios 1.x (JWT 자동 첨부 + 401 시 토큰 자동 갱신 + 실패 시 로그아웃)
- Create React App (react-scripts 5)
- Tiptap — WYSIWYG 리치 에디터
- 순수 CSS (`App.css`) — CSS 라이브러리 없음, CSS 변수로 테마 관리

## 개발 서버 실행
```bash
npm start        # http://localhost:3000
npm run build    # 프로덕션 빌드
```
`.env` 파일 필요 (루트에 위치):
```
REACT_APP_API_URL=http://localhost:8080
```
`.env` 변경 시 개발 서버 재시작 필요.

## 디렉토리 구조
```
src/
├── api/
│   ├── axios.js          # Axios 인스턴스, BASE_URL, JWT 인터셉터, 토큰 자동 갱신
│   ├── auth.js           # POST /auth/login, /auth/signup
│   ├── portfolio.js      # 포트폴리오 CRUD, like, toggleVisibility, uploadImage
│   ├── comment.js        # 댓글 CRUD
│   ├── notification.js   # 알림 조회, unread-count, markAllRead
│   └── template.js       # 템플릿 CRUD, use
├── context/
│   └── AuthContext.js    # 전역 user 상태, signIn(accessToken, refreshToken, user), signOut
├── components/
│   ├── Navbar.js         # 알림 벨(30초 폴링), 프로필 드롭다운, 작성 버튼
│   ├── PortfolioCard.js  # 목록 카드 (useNavigate로 작가 클릭 → 프로필)
│   ├── RichEditor.js     # Tiptap 에디터 (이미지 업로드, 서식)
│   └── RichEditor.css
└── pages/
    ├── LoginPage.js              # 로그인
    ├── RegisterPage.js           # 회원가입
    ├── PortfolioListPage.js      # 목록 + 검색 + 정렬 + 내 포트폴리오 필터 + 페이지네이션
    ├── PortfolioDetailPage.js    # 상세 + 좋아요 + 공개/비공개 토글 + 댓글 + 공유 버튼
    ├── PortfolioFormPage.js      # 생성/수정 공용 폼 (이미지 업로드, 리치 에디터, 스킬 관리)
    ├── ProfilePage.js            # 유저 프로필 (authorEmail로 포트폴리오 필터)
    └── TemplateListPage.js       # 템플릿 목록 + 검색 + 페이지네이션
```

## 라우팅 (`App.js`)
| 경로 | 컴포넌트 |
|------|----------|
| `/` | PortfolioListPage |
| `/login` | LoginPage |
| `/register` | RegisterPage |
| `/portfolio/new` | PortfolioFormPage |
| `/portfolio/:id` | PortfolioDetailPage |
| `/portfolio/:id/edit` | PortfolioFormPage |
| `/templates` | TemplateListPage |
| `/profile/:email` | ProfilePage |

## 인증 흐름
- `AuthContext`: localStorage에서 user 복원, `signIn(accessToken, refreshToken, user)` / `signOut()`
- 로그인 시 `accessToken`, `refreshToken`, `user` 모두 localStorage 저장
- Axios 요청 인터셉터: 모든 요청에 `Authorization: Bearer {token}` 자동 첨부
- Axios 응답 인터셉터: 401 수신 시 → refreshToken으로 갱신 시도 → 성공 시 원래 요청 재시도 → 실패 시 로그아웃

## 주요 패턴
- 폼 상태: `useState` + `handleChange`로 name 기반 일괄 업데이트
- API 호출: async/await, loading/error 상태 관리
- 페이지네이션: `page`, `totalPages` state + `Pagination` 컴포넌트
- CSS 변수: `--accent`, `--bg`, `--border`, `--text` 등으로 테마 일관성
- CSS 클래스명: `kebab-case` (예: `portfolio-card`, `btn-primary`)
- 중첩 `<a>` 금지: Link 안에 Link 불가 → `useNavigate`로 대체

## 백엔드 연동
- Base URL: `process.env.REACT_APP_API_URL` (`.env`에서 읽음)
- API 응답 목록: `Array.isArray(data) ? data : data.content ?? []` (배열/페이지 모두 처리)
- 이미지 표시: `${BASE_URL}${imageUrl}` (BASE_URL은 axios.js에서 export)

## 알림 시스템
- Navbar에서 30초 주기로 `GET /api/notifications/unread-count` 폴링
- 벨 클릭 시 전체 알림 조회 + 자동 읽음 처리
- 알림 클릭 시 해당 포트폴리오 상세 페이지로 이동

## 주의사항
- `PortfolioCard`에서 작가 이름 클릭: `useNavigate`로 `/profile/:email` 이동 (Link 중첩 방지)
- `CommentResponse`에 `authorEmail` 포함 — 댓글 작성자 프로필 링크에 사용
- `signIn` 시그니처: `signIn(accessToken, refreshToken, userData)` — 3개 인자

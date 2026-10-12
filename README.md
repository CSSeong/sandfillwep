# FILL Web

브라우저에서 누르고 드래그하여 색색의 모래를 쌓는 시뮬레이션입니다. 점수나 게임 규칙은 없습니다. 색상 선택, 붓 크기, 일시정지(P), 비우기(R), 터치 조작을 지원합니다.

흰 배경 전체가 모래 화면입니다. 알갱이마다 생성할 때 밝기를 조금씩 다르게 지정하고, 움직여도 같은 밝기를 유지합니다. 반투명 사용 안내는 페이지를 연 뒤 약 10초 후 사라집니다.

참고 저장소: https://github.com/yoonyLim/FILL (확인한 main에는 초기 Unity 프로젝트만 있어, 요청한 기능을 Canvas로 새로 구현했습니다.)

## 실행

`public/index.html` 파일 하나를 저장한 뒤 더블클릭해서 브라우저로 열면 됩니다. CSS와 JavaScript가 모두 HTML 안에 포함되어 있어, 서버·Node.js·인터넷 연결 없이 실행됩니다. 최신 Chrome, Edge, Firefox, Safari에서 사용할 수 있습니다.

마우스를 누르거나 터치하여 모래를 뿌립니다. 색상과 붓 크기를 바꿀 수 있고, P로 일시정지/계속하기, R로 비우기를 실행합니다.

## 선택: 개발 서버

클라우드에서 HTTP로 확인할 때만 Node.js 22 이상이 필요합니다.

```sh
npm ci --ignore-scripts
npm run dev
```

기본 포트는 3000이며 `PORT` 환경 변수로 바꿀 수 있습니다. 웹에 배포할 때는 `public/index.html`을 정적 호스팅에 올리면 됩니다.

## GitHub Pages 배포

GitHub Actions가 `public/` 폴더의 HTML 파일을 GitHub Pages에 배포합니다. 빌드나 외부 패키지 설치는 필요하지 않습니다.

저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다. **Actions → Deploy FILL to GitHub Pages → Run workflow**를 실행합니다. 배포가 끝나면 Pages 설정과 배포 실행 결과에 사이트 주소가 표시됩니다.

이후 `main` 브랜치의 `public/index.html`을 수정해 푸시하면 자동으로 다시 배포됩니다.

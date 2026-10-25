# FILL iPhone 앱

기존 모래 시뮬레이션을 SwiftUI 앱의 WKWebView 안에서 실행합니다. `public/index.html`을 앱에 직접 포함하므로 서버나 인터넷 연결 없이 동작합니다. 색상, 붓·입자 크기 조절, 일시정지, 비우기를 그대로 사용합니다. 앱이 비활성 상태가 되면 모래를 일시정지하고, 돌아온 뒤 계속하기 버튼으로 재개합니다.

## Mac에서 실행

1. Mac에 Xcode 15 이상을 설치합니다. 최신 아이폰/iOS에 연결할 때는 해당 기기를 지원하는 최신 Xcode를 사용합니다.
2. 이 저장소 전체를 내려받습니다. `ios/`만 따로 받으면 공유하는 `public/index.html`이 빠집니다.
3. `ios/FILL.xcodeproj`를 엽니다.
4. 상단 Scheme을 **FILL**, 실행 기기를 **iPhone Simulator**로 선택하고 실행(⌘R)합니다.

외부 라이브러리 설치, CocoaPods, npm 빌드, XcodeGen은 필요하지 않습니다. 앱의 최소 지원 버전은 iOS 16입니다. 웹 HTML을 수정하면 다음 앱 빌드에 바로 포함됩니다.

터미널에서는 저장소 루트에서 다음 명령으로 서명 없이 Simulator용 앱을 빌드할 수 있습니다.

```sh
xcodebuild \
  -project ios/FILL.xcodeproj \
  -scheme FILL \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/FILL-DerivedData \
  CODE_SIGNING_ALLOWED=NO \
  build
```

## 내 아이폰에 설치

Xcode의 **Settings → Accounts**에서 본인의 Apple 계정에 로그인합니다. FILL 타깃의 **Signing & Capabilities**에서 본인의 **Team**을 고르고, 예시 Bundle Identifier인 `com.example.FILLSand`를 고유한 값으로 바꿉니다. 아이폰을 연결하고 필요한 경우 기기의 개발자 모드를 켠 뒤 실행합니다. 개인 기기 테스트에는 무료 Apple 계정의 Personal Team을 사용할 수 있으며 무료 서명에는 사용 기간 등 제한이 있습니다. 계정 비밀번호나 인증서를 저장소에 넣지 마세요.

## GitHub에서 빌드 확인

저장소의 **Actions → Build iOS Simulator app → Run workflow**를 실행하면 GitHub의 macOS 환경에서 Simulator 빌드를 시도합니다. 성공하면 실행 결과의 Artifacts에 `FILL-iOS-Simulator`가 생성됩니다. 이 파일은 **Mac의 iOS Simulator용 앱**이며 아이폰에 설치하는 서명된 IPA가 아닙니다. 이 작업은 수동 실행 전용입니다.

## App Store 배포 준비

App Store 배포에는 유료 Apple Developer Program 가입, 앱의 고유 Bundle ID와 서명 설정, App Store Connect 등록이 필요합니다. 출시용 앱 아이콘, 스크린샷, 지원·개인정보 안내 페이지와 실제 기기 검증을 준비한 뒤 Xcode의 Archive 기능으로 제출합니다. 현재 프로젝트에는 출시용 앱 아이콘과 서명 정보가 포함되어 있지 않습니다.

현재 앱에는 로그인, 분석 SDK, 광고 또는 데이터 전송 기능이 없으며 이를 기준으로 개인정보 manifest를 작성했습니다. 모래와 설정은 메모리에만 있어 앱을 강제 종료하거나 웹 콘텐츠가 다시 로드되면 초기화됩니다. 데이터 저장·분석 등의 기능을 추가하면 관련 안내와 manifest도 함께 검토해야 합니다.

## 검증 상태

이 프로젝트를 준비한 클라우드 환경은 Linux여서 Xcode와 iOS SDK가 없습니다. 프로젝트·리소스 연결과 plist 구조를 정적으로 확인하고, 공유 HTML의 자동 테스트를 실행했습니다. iOS 컴파일, Simulator, 실제 아이폰 실행 및 App Store 제출은 아직 검증하지 않았습니다. Mac의 Xcode 또는 위의 GitHub Actions 빌드로 이어서 확인할 수 있습니다.

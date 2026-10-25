import SwiftUI
import WebKit

struct SandWebView: UIViewRepresentable {
    @Environment(\.scenePhase) private var scenePhase

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero)
        webView.backgroundColor = .white
        webView.scrollView.backgroundColor = .white
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.pinchGestureRecognizer?.isEnabled = false

        #if DEBUG
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        #endif

        guard let htmlURL = Bundle.main.url(forResource: "index", withExtension: "html") else {
            preconditionFailure("The app bundle must contain public/index.html as a resource.")
        }
        webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard scenePhase != .active else { return }
        // Match the web pause button; returning to the app never toggles a manual pause off.
        webView.evaluateJavaScript("""
            (() => {
                const button = document.getElementById('pause');
                if (button?.getAttribute('aria-pressed') === 'false') button.click();
                return null;
            })();
            """, completionHandler: nil)
    }
}

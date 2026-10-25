import SwiftUI

@main
struct FILLApp: App {
    var body: some Scene {
        WindowGroup {
            SandWebView()
                .background(Color.white.ignoresSafeArea())
                .preferredColorScheme(.light)
        }
    }
}

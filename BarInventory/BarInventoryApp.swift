import SwiftUI
import SwiftData

@main
struct BarInventoryApp: App {
    private let container = PersistenceController.makeContainer()
    @AppStorage(AppSettingsKey.appearance) private var appearanceRaw = AppAppearance.system.rawValue

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .preferredColorScheme(colorScheme)
        }
        .modelContainer(container)
    }

    private var colorScheme: ColorScheme? {
        switch AppAppearance(rawValue: appearanceRaw) ?? .system {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

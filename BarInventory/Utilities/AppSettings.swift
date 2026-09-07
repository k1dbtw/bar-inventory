import Foundation

/// Centralized UserDefaults keys used with @AppStorage across the app.
enum AppSettingsKey {
    static let appearance = "settings.appearance"
    static let notificationsEnabled = "settings.notificationsEnabled"
    static let expirationReminderDays = "settings.expirationReminderDays"
    static let dailyReminderEnabled = "settings.dailyReminderEnabled"
    static let dailyReminderHour = "settings.dailyReminderHour"
    static let dailyReminderMinute = "settings.dailyReminderMinute"
    static let expiringSoonWindowDays = "settings.expiringSoonWindowDays"
}

enum AppAppearance: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .system: return "System"
        case .light: return "Light"
        case .dark: return "Dark"
        }
    }

    var symbolName: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        }
    }
}

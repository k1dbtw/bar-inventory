import SwiftUI
import SwiftData

struct RootTabView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Query private var products: [Product]

    @AppStorage(AppSettingsKey.notificationsEnabled) private var notificationsEnabled = false
    @AppStorage(AppSettingsKey.expirationReminderDays) private var expirationReminderDays = 2

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }

            DashboardView()
                .tabItem { Label("Dashboard", systemImage: "chart.bar.fill") }

            HistoryView()
                .tabItem { Label("History", systemImage: "clock.fill") }

            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .task { await rescheduleNotifications() }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .active {
                Task { await rescheduleNotifications() }
            }
        }
        .onChange(of: products) { _, _ in
            Task { await rescheduleNotifications() }
        }
    }

    private func rescheduleNotifications() async {
        guard notificationsEnabled else { return }
        await NotificationManager.shared.rescheduleExpirationReminders(
            for: products,
            reminderDays: expirationReminderDays
        )
    }
}

#Preview {
    RootTabView()
        .modelContainer(PersistenceController.previewContainer())
}

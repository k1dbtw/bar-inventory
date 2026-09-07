import SwiftUI
import UIKit

struct SettingsView: View {
    @AppStorage(AppSettingsKey.appearance) private var appearanceRaw = AppAppearance.system.rawValue
    @AppStorage(AppSettingsKey.notificationsEnabled) private var notificationsEnabled = false
    @AppStorage(AppSettingsKey.expirationReminderDays) private var expirationReminderDays = 2
    @AppStorage(AppSettingsKey.dailyReminderEnabled) private var dailyReminderEnabled = false
    @AppStorage(AppSettingsKey.dailyReminderHour) private var dailyReminderHour = 9
    @AppStorage(AppSettingsKey.dailyReminderMinute) private var dailyReminderMinute = 0
    @AppStorage(AppSettingsKey.expiringSoonWindowDays) private var expiringSoonWindowDays = 3

    @State private var showingPermissionAlert = false

    private var appearance: Binding<AppAppearance> {
        Binding(
            get: { AppAppearance(rawValue: appearanceRaw) ?? .system },
            set: { appearanceRaw = $0.rawValue }
        )
    }

    private var dailyReminderTime: Binding<Date> {
        Binding(
            get: {
                var components = DateComponents()
                components.hour = dailyReminderHour
                components.minute = dailyReminderMinute
                return Calendar.current.date(from: components) ?? .now
            },
            set: { newValue in
                let components = Calendar.current.dateComponents([.hour, .minute], from: newValue)
                dailyReminderHour = components.hour ?? 9
                dailyReminderMinute = components.minute ?? 0
                if dailyReminderEnabled {
                    NotificationManager.shared.scheduleDailyReminder(hour: dailyReminderHour, minute: dailyReminderMinute)
                }
            }
        )
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Appearance") {
                    Picker("Appearance", selection: appearance) {
                        ForEach(AppAppearance.allCases) { option in
                            Label(option.displayName, systemImage: option.symbolName).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section {
                    Toggle("Enable Notifications", isOn: notificationsToggleBinding)

                    if notificationsEnabled {
                        Stepper(value: $expirationReminderDays, in: 1...7) {
                            Text("Remind \(expirationReminderDays) day\(expirationReminderDays == 1 ? "" : "s") before expiration")
                        }

                        Toggle("Daily check-in reminder", isOn: dailyReminderToggleBinding)

                        if dailyReminderEnabled {
                            DatePicker("Reminder time", selection: dailyReminderTime, displayedComponents: .hourAndMinute)
                        }
                    }
                } header: {
                    Text("Notifications")
                } footer: {
                    Text("Get alerted when a product is about to expire or crosses into low stock.")
                }

                Section {
                    Stepper(value: $expiringSoonWindowDays, in: 1...14) {
                        Text("Expiring soon within \(expiringSoonWindowDays) day\(expiringSoonWindowDays == 1 ? "" : "s")")
                    }
                } header: {
                    Text("Home Screen")
                } footer: {
                    Text("Controls which products show up under \"Expiring Soon\" on the Home tab.")
                }

                Section("Data") {
                    NavigationLink {
                        ArchivedProductsView()
                    } label: {
                        Label("Archived Products", systemImage: "archivebox")
                    }
                }

                Section("About") {
                    LabeledContent("Version", value: "1.0")
                    Text("Bar Inventory keeps track of stock, expiration dates, and write-offs — entirely on your device.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
            .alert("Notifications Disabled", isPresented: $showingPermissionAlert) {
                Button("Open Settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Allow notifications in iOS Settings to get expiration and low stock alerts.")
            }
        }
    }

    private var notificationsToggleBinding: Binding<Bool> {
        Binding(
            get: { notificationsEnabled },
            set: { newValue in
                if newValue {
                    Task {
                        let granted = await NotificationManager.shared.requestAuthorization()
                        notificationsEnabled = granted
                        if !granted {
                            showingPermissionAlert = true
                        } else if dailyReminderEnabled {
                            NotificationManager.shared.scheduleDailyReminder(hour: dailyReminderHour, minute: dailyReminderMinute)
                        }
                    }
                } else {
                    notificationsEnabled = false
                    NotificationManager.shared.cancelAll()
                }
            }
        )
    }

    private var dailyReminderToggleBinding: Binding<Bool> {
        Binding(
            get: { dailyReminderEnabled },
            set: { newValue in
                dailyReminderEnabled = newValue
                if newValue {
                    NotificationManager.shared.scheduleDailyReminder(hour: dailyReminderHour, minute: dailyReminderMinute)
                } else {
                    NotificationManager.shared.cancelDailyReminder()
                }
            }
        )
    }
}

#Preview {
    SettingsView()
        .modelContainer(PersistenceController.previewContainer())
}

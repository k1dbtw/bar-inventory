import Foundation
import UserNotifications

@MainActor
final class NotificationManager {
    static let shared = NotificationManager()

    private let center = UNUserNotificationCenter.current()
    private let expiryPrefix = "expiry-"
    private let lowStockPrefix = "lowstock-"
    private let dailyReminderID = "daily-reminder"

    private init() {}

    // MARK: - Authorization

    func requestAuthorization() async -> Bool {
        do {
            return try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    func authorizationStatus() async -> UNAuthorizationStatus {
        await center.notificationSettings().authorizationStatus
    }

    // MARK: - Expiration reminders

    /// Recomputes and reschedules all expiration reminders for the given active products.
    /// Call this whenever product data changes or on app foreground.
    func rescheduleExpirationReminders(for products: [Product], reminderDays: Int) async {
        let pending = await center.pendingNotificationRequests()
        let expiryIDs = pending
            .map(\.identifier)
            .filter { $0.hasPrefix(expiryPrefix) }
        center.removePendingNotificationRequests(withIdentifiers: expiryIDs)

        for product in products where !product.isArchived {
            guard let expirationDate = product.expirationDate else { continue }
            guard let reminderDate = Calendar.current.date(byAdding: .day, value: -reminderDays, to: expirationDate) else { continue }

            var components = Calendar.current.dateComponents([.year, .month, .day], from: reminderDate)
            components.hour = 10
            components.minute = 0

            guard let triggerDate = Calendar.current.date(from: components), triggerDate > .now else { continue }

            let content = UNMutableNotificationContent()
            content.title = "Expiring soon"
            content.body = "\(product.name) expires in \(reminderDays) day\(reminderDays == 1 ? "" : "s")."
            content.sound = .default

            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            let request = UNNotificationRequest(
                identifier: expiryPrefix + product.id.uuidString,
                content: content,
                trigger: trigger
            )
            try? await center.add(request)
        }
    }

    func cancelExpirationReminder(for product: Product) {
        center.removePendingNotificationRequests(withIdentifiers: [expiryPrefix + product.id.uuidString])
    }

    // MARK: - Low stock (instant, fired on the crossing event)

    /// Fires a near-instant local notification the moment a product's quantity crosses into low stock.
    func notifyLowStockCrossed(product: Product) {
        let content = UNMutableNotificationContent()
        content.title = "Running low"
        content.body = "\(product.name) is down to \(Formatters.quantity(product.currentQuantity, unit: product.unit))."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: lowStockPrefix + product.id.uuidString + "-" + UUID().uuidString,
            content: content,
            trigger: trigger
        )
        center.add(request)
    }

    // MARK: - Daily reminder

    func scheduleDailyReminder(hour: Int, minute: Int) {
        center.removePendingNotificationRequests(withIdentifiers: [dailyReminderID])

        let content = UNMutableNotificationContent()
        content.title = "Bar check-in"
        content.body = "Open Bar Inventory to review today's stock and expiring items."
        content.sound = .default

        var components = DateComponents()
        components.hour = hour
        components.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(identifier: dailyReminderID, content: content, trigger: trigger)
        center.add(request)
    }

    func cancelDailyReminder() {
        center.removePendingNotificationRequests(withIdentifiers: [dailyReminderID])
    }

    // MARK: - Bulk

    func cancelAll() {
        center.removeAllPendingNotificationRequests()
    }
}

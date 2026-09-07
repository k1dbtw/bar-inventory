import Foundation
import SwiftData

@Model
final class Product {
    var id: UUID
    var name: String
    var categoryRaw: String
    var unitRaw: String
    var currentQuantity: Double
    var lowStockThreshold: Double
    var expirationDate: Date?
    var createdAt: Date
    var updatedAt: Date
    var isArchived: Bool
    var archivedAt: Date?
    var notes: String

    @Relationship(deleteRule: .nullify, inverse: \HistoryEntry.product)
    var historyEntries: [HistoryEntry]? = []

    init(
        name: String,
        category: ProductCategory,
        unit: MeasurementUnit,
        currentQuantity: Double,
        lowStockThreshold: Double,
        expirationDate: Date? = nil,
        notes: String = ""
    ) {
        self.id = UUID()
        self.name = name
        self.categoryRaw = category.rawValue
        self.unitRaw = unit.rawValue
        self.currentQuantity = currentQuantity
        self.lowStockThreshold = lowStockThreshold
        self.expirationDate = expirationDate
        self.createdAt = .now
        self.updatedAt = .now
        self.isArchived = false
        self.archivedAt = nil
        self.notes = notes
    }

    var category: ProductCategory {
        get { ProductCategory(rawValue: categoryRaw) ?? .other }
        set { categoryRaw = newValue.rawValue }
    }

    var unit: MeasurementUnit {
        get { MeasurementUnit(rawValue: unitRaw) ?? .pieces }
        set { unitRaw = newValue.rawValue }
    }

    var isOutOfStock: Bool {
        currentQuantity <= 0
    }

    var isLowStock: Bool {
        currentQuantity > 0 && currentQuantity <= lowStockThreshold
    }

    /// Whole days remaining until expiration. Negative if already expired.
    var daysUntilExpiration: Int? {
        guard let expirationDate else { return nil }
        let startOfToday = Calendar.current.startOfDay(for: .now)
        let startOfExpiry = Calendar.current.startOfDay(for: expirationDate)
        return Calendar.current.dateComponents([.day], from: startOfToday, to: startOfExpiry).day
    }

    var isExpired: Bool {
        guard let days = daysUntilExpiration else { return false }
        return days < 0
    }

    func isExpiringSoon(within days: Int) -> Bool {
        guard let daysLeft = daysUntilExpiration else { return false }
        return daysLeft >= 0 && daysLeft <= days
    }
}

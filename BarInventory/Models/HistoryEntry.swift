import Foundation
import SwiftData

@Model
final class HistoryEntry {
    var id: UUID
    var date: Date
    var productName: String
    var categoryRaw: String
    var unitRaw: String
    var changeTypeRaw: String
    var quantityDelta: Double
    var resultingQuantity: Double
    var reasonRaw: String?
    var product: Product?

    init(
        date: Date = .now,
        productName: String,
        category: ProductCategory,
        unit: MeasurementUnit,
        changeType: HistoryChangeType,
        quantityDelta: Double,
        resultingQuantity: Double,
        reason: WriteOffReason? = nil,
        product: Product? = nil
    ) {
        self.id = UUID()
        self.date = date
        self.productName = productName
        self.categoryRaw = category.rawValue
        self.unitRaw = unit.rawValue
        self.changeTypeRaw = changeType.rawValue
        self.quantityDelta = quantityDelta
        self.resultingQuantity = resultingQuantity
        self.reasonRaw = reason?.rawValue
        self.product = product
    }

    var category: ProductCategory {
        ProductCategory(rawValue: categoryRaw) ?? .other
    }

    var unit: MeasurementUnit {
        MeasurementUnit(rawValue: unitRaw) ?? .pieces
    }

    var changeType: HistoryChangeType {
        HistoryChangeType(rawValue: changeTypeRaw) ?? .adjustment
    }

    var reason: WriteOffReason? {
        reasonRaw.flatMap { WriteOffReason(rawValue: $0) }
    }
}

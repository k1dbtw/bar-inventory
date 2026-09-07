import Foundation
import SwiftData

/// Centralizes every mutation that touches a Product, so each change is
/// paired with the matching HistoryEntry and low-stock notification check.
@MainActor
enum InventoryActions {
    static func adjust(_ product: Product, delta: Double, in context: ModelContext, notifyIfLowStock: Bool) {
        let wasHealthy = !product.isLowStock && !product.isOutOfStock
        let applied = max(0, product.currentQuantity + delta) - product.currentQuantity
        guard applied != 0 else { return }
        product.currentQuantity += applied
        product.updatedAt = .now

        context.insert(HistoryEntry(
            productName: product.name,
            category: product.category,
            unit: product.unit,
            changeType: .adjustment,
            quantityDelta: applied,
            resultingQuantity: product.currentQuantity,
            product: product
        ))

        if notifyIfLowStock, wasHealthy, product.isLowStock || product.isOutOfStock {
            NotificationManager.shared.notifyLowStockCrossed(product: product)
        }
    }

    static func writeOff(_ product: Product, amount: Double, reason: WriteOffReason, in context: ModelContext, notifyIfLowStock: Bool) {
        let wasHealthy = !product.isLowStock && !product.isOutOfStock
        let delta = -min(amount, product.currentQuantity)
        guard delta != 0 else { return }
        product.currentQuantity += delta
        product.updatedAt = .now

        context.insert(HistoryEntry(
            productName: product.name,
            category: product.category,
            unit: product.unit,
            changeType: .writeOff,
            quantityDelta: delta,
            resultingQuantity: product.currentQuantity,
            reason: reason,
            product: product
        ))

        if notifyIfLowStock, wasHealthy, product.isLowStock || product.isOutOfStock {
            NotificationManager.shared.notifyLowStockCrossed(product: product)
        }
    }

    /// Logs a single history entry for a product whose quantity was already
    /// mutated in place (e.g. by repeated stepper taps in a sheet), comparing
    /// against the quantity captured before those taps began.
    static func logNetAdjustment(_ product: Product, previousQuantity: Double, in context: ModelContext, notifyIfLowStock: Bool) {
        let delta = product.currentQuantity - previousQuantity
        guard delta != 0 else { return }
        let wasHealthy = previousQuantity > product.lowStockThreshold
        product.updatedAt = .now

        context.insert(HistoryEntry(
            productName: product.name,
            category: product.category,
            unit: product.unit,
            changeType: .adjustment,
            quantityDelta: delta,
            resultingQuantity: product.currentQuantity,
            product: product
        ))

        if notifyIfLowStock, wasHealthy, product.isLowStock || product.isOutOfStock {
            NotificationManager.shared.notifyLowStockCrossed(product: product)
        }
    }

    static func logEdit(_ product: Product, in context: ModelContext) {
        product.updatedAt = .now
        context.insert(HistoryEntry(
            productName: product.name,
            category: product.category,
            unit: product.unit,
            changeType: .edited,
            quantityDelta: 0,
            resultingQuantity: product.currentQuantity,
            product: product
        ))
    }

    static func archive(_ product: Product, in context: ModelContext) {
        product.isArchived = true
        product.archivedAt = .now
        product.updatedAt = .now

        context.insert(HistoryEntry(
            productName: product.name,
            category: product.category,
            unit: product.unit,
            changeType: .archived,
            quantityDelta: 0,
            resultingQuantity: product.currentQuantity,
            product: product
        ))

        NotificationManager.shared.cancelExpirationReminder(for: product)
    }

    static func restore(_ product: Product, in context: ModelContext) {
        product.isArchived = false
        product.archivedAt = nil
        product.updatedAt = .now

        context.insert(HistoryEntry(
            productName: product.name,
            category: product.category,
            unit: product.unit,
            changeType: .restored,
            quantityDelta: 0,
            resultingQuantity: product.currentQuantity,
            product: product
        ))
    }

    @discardableResult
    static func create(
        name: String,
        category: ProductCategory,
        unit: MeasurementUnit,
        quantity: Double,
        lowStockThreshold: Double,
        expirationDate: Date?,
        notes: String,
        in context: ModelContext
    ) -> Product {
        let product = Product(
            name: name,
            category: category,
            unit: unit,
            currentQuantity: quantity,
            lowStockThreshold: lowStockThreshold,
            expirationDate: expirationDate,
            notes: notes
        )
        context.insert(product)

        context.insert(HistoryEntry(
            productName: product.name,
            category: category,
            unit: unit,
            changeType: .created,
            quantityDelta: quantity,
            resultingQuantity: quantity,
            product: product
        ))

        return product
    }
}

import Foundation
import SwiftData

enum SampleData {
    @MainActor
    static func populate(_ context: ModelContext) {
        let calendar = Calendar.current

        func days(_ offset: Int) -> Date {
            calendar.date(byAdding: .day, value: offset, to: .now) ?? .now
        }

        let products: [Product] = [
            Product(name: "Whole Milk", category: .milkAndDairy, unit: .liters, currentQuantity: 2, lowStockThreshold: 3, expirationDate: days(2)),
            Product(name: "Oat Milk", category: .milkAndDairy, unit: .liters, currentQuantity: 5, lowStockThreshold: 2, expirationDate: days(6)),
            Product(name: "Espresso Beans", category: .coffee, unit: .kilograms, currentQuantity: 1.5, lowStockThreshold: 1),
            Product(name: "Vanilla Syrup", category: .syrup, unit: .milliliters, currentQuantity: 150, lowStockThreshold: 200, expirationDate: days(45)),
            Product(name: "Caramel Syrup", category: .syrup, unit: .milliliters, currentQuantity: 700, lowStockThreshold: 200, expirationDate: days(90)),
            Product(name: "Orange Juice", category: .juice, unit: .liters, currentQuantity: 1, lowStockThreshold: 2, expirationDate: days(1)),
            Product(name: "Lemons", category: .fruit, unit: .pieces, currentQuantity: 4, lowStockThreshold: 6, expirationDate: days(3)),
            Product(name: "Fresh Mint", category: .fruit, unit: .pieces, currentQuantity: 0, lowStockThreshold: 5, expirationDate: days(-1)),
            Product(name: "Prosecco", category: .alcohol, unit: .bottles, currentQuantity: 6, lowStockThreshold: 2),
            Product(name: "Croissants", category: .bakery, unit: .pieces, currentQuantity: 3, lowStockThreshold: 5, expirationDate: days(0)),
            Product(name: "Sparkling Water", category: .softDrink, unit: .bottles, currentQuantity: 12, lowStockThreshold: 4),
        ]

        for product in products {
            context.insert(product)
        }

        let history: [HistoryEntry] = [
            HistoryEntry(date: days(0), productName: "Whole Milk", category: .milkAndDairy, unit: .liters, changeType: .adjustment, quantityDelta: -1, resultingQuantity: 2, product: products[0]),
            HistoryEntry(date: days(-1), productName: "Fresh Mint", category: .fruit, unit: .pieces, changeType: .writeOff, quantityDelta: -3, resultingQuantity: 0, reason: .spoiled, product: products[7]),
            HistoryEntry(date: days(-1), productName: "Croissants", category: .bakery, unit: .pieces, changeType: .restock, quantityDelta: 6, resultingQuantity: 9, product: products[9]),
            HistoryEntry(date: days(-2), productName: "Orange Juice", category: .juice, unit: .liters, changeType: .writeOff, quantityDelta: -1, resultingQuantity: 1, reason: .expired, product: products[5]),
        ]

        for entry in history {
            context.insert(entry)
        }
    }
}

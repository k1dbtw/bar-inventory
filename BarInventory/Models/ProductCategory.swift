import SwiftUI

enum ProductCategory: String, CaseIterable, Identifiable, Codable {
    case coffee
    case milkAndDairy
    case syrup
    case juice
    case fruit
    case alcohol
    case softDrink
    case bakery
    case other

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .coffee: return "Coffee"
        case .milkAndDairy: return "Milk & Dairy"
        case .syrup: return "Syrups"
        case .juice: return "Juice"
        case .fruit: return "Fruit"
        case .alcohol: return "Alcohol"
        case .softDrink: return "Soft Drinks"
        case .bakery: return "Bakery"
        case .other: return "Other"
        }
    }

    var symbolName: String {
        switch self {
        case .coffee: return "cup.and.saucer.fill"
        case .milkAndDairy: return "drop.fill"
        case .syrup: return "flask.fill"
        case .juice: return "waterbottle.fill"
        case .fruit: return "apple.logo"
        case .alcohol: return "wineglass.fill"
        case .softDrink: return "bubbles.and.sparkles.fill"
        case .bakery: return "birthday.cake.fill"
        case .other: return "shippingbox.fill"
        }
    }

    var tint: Color {
        switch self {
        case .coffee: return Color(red: 0.51, green: 0.33, blue: 0.20)
        case .milkAndDairy: return Color(red: 0.35, green: 0.58, blue: 0.90)
        case .syrup: return Color(red: 0.86, green: 0.45, blue: 0.62)
        case .juice: return Color(red: 0.96, green: 0.62, blue: 0.15)
        case .fruit: return Color(red: 0.83, green: 0.30, blue: 0.28)
        case .alcohol: return Color(red: 0.55, green: 0.36, blue: 0.75)
        case .softDrink: return Color(red: 0.20, green: 0.68, blue: 0.62)
        case .bakery: return Color(red: 0.78, green: 0.55, blue: 0.28)
        case .other: return Color(red: 0.55, green: 0.55, blue: 0.58)
        }
    }
}

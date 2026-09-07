import Foundation

enum MeasurementUnit: String, CaseIterable, Identifiable, Codable {
    case pieces
    case grams
    case kilograms
    case milliliters
    case liters
    case bottles
    case cups

    var id: String { rawValue }

    var shortLabel: String {
        switch self {
        case .pieces: return "pcs"
        case .grams: return "g"
        case .kilograms: return "kg"
        case .milliliters: return "ml"
        case .liters: return "L"
        case .bottles: return "btl"
        case .cups: return "cups"
        }
    }

    var displayName: String {
        switch self {
        case .pieces: return "Pieces"
        case .grams: return "Grams"
        case .kilograms: return "Kilograms"
        case .milliliters: return "Milliliters"
        case .liters: return "Liters"
        case .bottles: return "Bottles"
        case .cups: return "Cups"
        }
    }

    /// The step size used for quick +/- adjustments in this unit.
    var quickStep: Double {
        switch self {
        case .pieces, .bottles, .cups: return 1
        case .grams: return 50
        case .kilograms: return 0.5
        case .milliliters: return 100
        case .liters: return 0.5
        }
    }

    var largeStep: Double {
        switch self {
        case .pieces, .bottles, .cups: return 5
        case .grams: return 250
        case .kilograms: return 1
        case .milliliters: return 500
        case .liters: return 1
        }
    }

    /// Whether values in this unit are typically whole numbers.
    var isWholeNumber: Bool {
        switch self {
        case .pieces, .bottles, .cups: return true
        case .grams, .kilograms, .milliliters, .liters: return false
        }
    }
}

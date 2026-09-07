import Foundation

enum WriteOffReason: String, CaseIterable, Identifiable, Codable {
    case expired
    case spoiled
    case broken
    case mistake
    case other

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .expired: return "Expired"
        case .spoiled: return "Spoiled"
        case .broken: return "Broken"
        case .mistake: return "Mistake"
        case .other: return "Other"
        }
    }

    var symbolName: String {
        switch self {
        case .expired: return "calendar.badge.exclamationmark"
        case .spoiled: return "exclamationmark.triangle.fill"
        case .broken: return "hammer.fill"
        case .mistake: return "arrow.uturn.backward"
        case .other: return "questionmark.circle.fill"
        }
    }
}

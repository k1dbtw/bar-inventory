import SwiftUI

enum HistoryChangeType: String, CaseIterable, Identifiable, Codable {
    case created
    case restock
    case adjustment
    case writeOff
    case edited
    case archived
    case restored

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .created: return "Added"
        case .restock: return "Restocked"
        case .adjustment: return "Adjusted"
        case .writeOff: return "Written Off"
        case .edited: return "Edited"
        case .archived: return "Archived"
        case .restored: return "Restored"
        }
    }

    var symbolName: String {
        switch self {
        case .created: return "plus.circle.fill"
        case .restock: return "arrow.up.circle.fill"
        case .adjustment: return "slider.horizontal.3"
        case .writeOff: return "trash.circle.fill"
        case .edited: return "pencil.circle.fill"
        case .archived: return "archivebox.circle.fill"
        case .restored: return "arrow.uturn.up.circle.fill"
        }
    }

    var tint: Color {
        switch self {
        case .created: return .blue
        case .restock: return .green
        case .adjustment: return .orange
        case .writeOff: return .red
        case .edited: return .purple
        case .archived: return .gray
        case .restored: return .teal
        }
    }
}

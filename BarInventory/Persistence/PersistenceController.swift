import Foundation
import SwiftData

enum PersistenceController {
    static var schema: Schema {
        Schema([Product.self, HistoryEntry.self])
    }

    /// The main on-disk container used by the running app.
    static func makeContainer() -> ModelContainer {
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
    }

    /// An in-memory container pre-populated with sample data, used for SwiftUI previews.
    @MainActor
    static func previewContainer() -> ModelContainer {
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container: ModelContainer
        do {
            container = try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Failed to create preview ModelContainer: \(error)")
        }
        SampleData.populate(container.mainContext)
        return container
    }
}

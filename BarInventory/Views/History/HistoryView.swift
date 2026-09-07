import SwiftUI
import SwiftData

struct HistoryView: View {
    @Query(sort: \HistoryEntry.date, order: .reverse)
    private var allEntries: [HistoryEntry]

    @State private var filter: HistoryChangeType?

    private var filteredEntries: [HistoryEntry] {
        guard let filter else { return allEntries }
        return allEntries.filter { $0.changeType == filter }
    }

    private var groupedByDay: [(day: Date, entries: [HistoryEntry])] {
        let calendar = Calendar.current
        let groups = Dictionary(grouping: filteredEntries) { calendar.startOfDay(for: $0.date) }
        return groups
            .map { (day: $0.key, entries: $0.value) }
            .sorted { $0.day > $1.day }
    }

    var body: some View {
        NavigationStack {
            Group {
                if filteredEntries.isEmpty {
                    emptyState
                } else {
                    List {
                        ForEach(groupedByDay, id: \.day) { group in
                            Section(Formatters.relativeDay(group.day)) {
                                ForEach(group.entries) { entry in
                                    HistoryRow(entry: entry)
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("History")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button {
                            filter = nil
                        } label: {
                            HStack {
                                Text("All")
                                if filter == nil { Image(systemName: "checkmark") }
                            }
                        }
                        Divider()
                        ForEach(HistoryChangeType.allCases) { type in
                            Button {
                                filter = type
                            } label: {
                                HStack {
                                    Text(type.displayName)
                                    if filter == type { Image(systemName: "checkmark") }
                                }
                            }
                        }
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle\(filter == nil ? "" : ".fill")")
                            .font(.title3)
                    }
                    .accessibilityLabel("Filter history")
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "clock")
                .font(.system(size: 44))
                .foregroundStyle(.tertiary)
            Text(filter == nil ? "No activity yet" : "No matching activity")
                .font(.headline)
            Text("Restocks, write-offs, and edits will show up here.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    HistoryView()
        .modelContainer(PersistenceController.previewContainer())
}

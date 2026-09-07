import SwiftUI
import SwiftData
import Charts

struct DashboardView: View {
    @Query(filter: #Predicate<Product> { !$0.isArchived })
    private var products: [Product]

    @Query(sort: \HistoryEntry.date, order: .reverse)
    private var historyEntries: [HistoryEntry]

    @AppStorage(AppSettingsKey.expiringSoonWindowDays) private var expiringSoonWindowDays = 3

    private struct DayCount: Identifiable {
        let id = UUID()
        let day: Date
        let count: Int
    }

    private var lowStockCount: Int {
        products.filter { $0.isLowStock || $0.isOutOfStock }.count
    }

    private var expiringSoonCount: Int {
        products.filter { $0.isExpiringSoon(within: expiringSoonWindowDays) || $0.isExpired }.count
    }

    private var recentWriteOffs: [HistoryEntry] {
        let cutoff = Calendar.current.date(byAdding: .day, value: -6, to: Calendar.current.startOfDay(for: .now)) ?? .now
        return historyEntries.filter { $0.changeType == .writeOff && $0.date >= cutoff }
    }

    private var mostWastedProductName: (name: String, count: Int)? {
        let counts = Dictionary(grouping: recentWriteOffs, by: \.productName).mapValues(\.count)
        guard let top = counts.max(by: { $0.value < $1.value }) else { return nil }
        return (top.key, top.value)
    }

    private var chartData: [DayCount] {
        let calendar = Calendar.current
        return (0..<7).reversed().map { offset in
            let day = calendar.date(byAdding: .day, value: -offset, to: calendar.startOfDay(for: .now)) ?? .now
            let count = recentWriteOffs.filter { calendar.isDate($0.date, inSameDayAs: day) }.count
            return DayCount(day: day, count: count)
        }
    }

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    LazyVGrid(columns: columns, spacing: 12) {
                        StatCard(title: "Total Products", value: "\(products.count)", symbolName: "shippingbox.fill", tint: .blue)
                        StatCard(title: "Low Stock", value: "\(lowStockCount)", symbolName: "arrow.down.circle.fill", tint: .orange)
                        StatCard(title: "Expiring Soon", value: "\(expiringSoonCount)", symbolName: "clock.badge.exclamationmark.fill", tint: .red)
                        StatCard(title: "Written Off (7d)", value: "\(recentWriteOffs.count)", symbolName: "trash.fill", tint: .gray)
                    }

                    RoundedCard {
                        VStack(alignment: .leading, spacing: 16) {
                            SectionHeader(title: "Write-offs This Week", symbolName: "chart.bar.fill")

                            if recentWriteOffs.isEmpty {
                                Text("No write-offs in the last 7 days.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .frame(maxWidth: .infinity, minHeight: 140)
                            } else {
                                Chart(chartData) { item in
                                    BarMark(
                                        x: .value("Day", item.day, unit: .day),
                                        y: .value("Write-offs", item.count)
                                    )
                                    .foregroundStyle(Color.red.gradient)
                                    .cornerRadius(6)
                                }
                                .chartXAxis {
                                    AxisMarks(values: .stride(by: .day)) { _ in
                                        AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                                    }
                                }
                                .chartYAxis {
                                    AxisMarks(position: .leading)
                                }
                                .frame(height: 160)
                            }
                        }
                    }

                    if let mostWasted = mostWastedProductName {
                        RoundedCard {
                            HStack(spacing: 12) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .font(.title2)
                                    .foregroundStyle(.orange)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Most written off this week")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                    Text("\(mostWasted.name) · \(mostWasted.count) time\(mostWasted.count == 1 ? "" : "s")")
                                        .font(.subheadline.weight(.semibold))
                                }
                                Spacer()
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Dashboard")
        }
    }
}

#Preview {
    DashboardView()
        .modelContainer(PersistenceController.previewContainer())
}

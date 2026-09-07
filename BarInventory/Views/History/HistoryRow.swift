import SwiftUI

struct HistoryRow: View {
    let entry: HistoryEntry

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: entry.changeType.symbolName)
                .font(.title3)
                .foregroundStyle(entry.changeType.tint)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 3) {
                Text(entry.productName)
                    .font(.body.weight(.semibold))

                HStack(spacing: 6) {
                    Text(entry.changeType.displayName)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if entry.quantityDelta != 0 {
                        Text("•")
                            .foregroundStyle(.tertiary)
                        Text(deltaLabel)
                            .font(.caption.weight(.medium))
                            .foregroundStyle(entry.quantityDelta > 0 ? .green : .red)
                    }

                    if let reason = entry.reason {
                        Text("•")
                            .foregroundStyle(.tertiary)
                        Text(reason.displayName)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Spacer()

            Text(Formatters.time(entry.date))
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }

    private var deltaLabel: String {
        let sign = entry.quantityDelta > 0 ? "+" : ""
        return "\(sign)\(Formatters.quantity(entry.quantityDelta, unit: entry.unit))"
    }
}

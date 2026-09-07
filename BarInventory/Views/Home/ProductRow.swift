import SwiftUI

struct ProductRow: View {
    let product: Product

    var body: some View {
        HStack(spacing: 12) {
            CategoryIconBadge(category: product.category)

            VStack(alignment: .leading, spacing: 3) {
                Text(product.name)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.primary)

                HStack(spacing: 6) {
                    StatusDot(color: statusColor)
                    Text(Formatters.quantity(product.currentQuantity, unit: product.unit))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    if let expiryText {
                        Text("•")
                            .foregroundStyle(.tertiary)
                        Text(expiryText)
                            .font(.caption.weight(.medium))
                            .foregroundStyle(expiryColor)
                    }
                }
            }

            Spacer(minLength: 8)

            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }

    private var statusColor: Color {
        if product.isOutOfStock { return .red }
        if product.isLowStock { return .orange }
        return .green
    }

    private var expiryText: String? {
        guard let days = product.daysUntilExpiration, days <= 7 else { return nil }
        if days < 0 { return "Expired" }
        if days == 0 { return "Today" }
        if days == 1 { return "Tomorrow" }
        return "\(days)d left"
    }

    private var expiryColor: Color {
        guard let days = product.daysUntilExpiration else { return .secondary }
        if days < 0 { return .red }
        if days <= 2 { return .orange }
        return .secondary
    }
}

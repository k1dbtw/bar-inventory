import SwiftUI

struct Chip: View {
    let title: String
    var symbolName: String? = nil
    var tint: Color = .accentColor
    var isSelected: Bool = false
    var action: (() -> Void)? = nil

    var body: some View {
        let label = HStack(spacing: 5) {
            if let symbolName {
                Image(systemName: symbolName)
                    .font(.caption.weight(.semibold))
            }
            Text(title)
                .font(.subheadline.weight(.medium))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(
            Capsule().fill(isSelected ? tint : tint.opacity(0.14))
        )
        .foregroundStyle(isSelected ? .white : tint)

        if let action {
            Button(action: action) { label }
                .buttonStyle(.plain)
        } else {
            label
        }
    }
}

struct StatusDot: View {
    let color: Color

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: 8, height: 8)
    }
}

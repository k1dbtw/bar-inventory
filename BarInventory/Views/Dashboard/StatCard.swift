import SwiftUI

struct StatCard: View {
    let title: String
    let value: String
    let symbolName: String
    let tint: Color

    var body: some View {
        RoundedCard(padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(tint.opacity(0.16))
                        .frame(width: 32, height: 32)
                    Image(systemName: symbolName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(tint)
                }

                Text(value)
                    .font(.title.weight(.bold))
                    .contentTransition(.numericText())

                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

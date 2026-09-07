import SwiftUI

struct AllGoodBanner: View {
    var body: some View {
        RoundedCard {
            HStack(spacing: 12) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.title2)
                    .foregroundStyle(.green)
                VStack(alignment: .leading, spacing: 2) {
                    Text("All stocked up")
                        .font(.subheadline.weight(.semibold))
                    Text("Nothing is low or expiring soon.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
        }
    }
}

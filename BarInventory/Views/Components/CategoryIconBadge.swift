import SwiftUI

struct CategoryIconBadge: View {
    let category: ProductCategory
    var size: CGFloat = 44

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
                .fill(category.tint.opacity(0.16))
            Image(systemName: category.symbolName)
                .font(.system(size: size * 0.42, weight: .semibold))
                .foregroundStyle(category.tint)
        }
        .frame(width: size, height: size)
    }
}

import SwiftUI
import SwiftData

struct ArchivedProductsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(filter: #Predicate<Product> { $0.isArchived }, sort: \Product.archivedAt, order: .reverse)
    private var archivedProducts: [Product]

    @State private var pendingDeletion: Product?

    var body: some View {
        Group {
            if archivedProducts.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "archivebox")
                        .font(.system(size: 44))
                        .foregroundStyle(.tertiary)
                    Text("No archived products")
                        .font(.headline)
                    Text("Products you archive from Home will show up here.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(40)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    ForEach(archivedProducts) { product in
                        HStack(spacing: 12) {
                            CategoryIconBadge(category: product.category)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(product.name)
                                    .font(.body.weight(.semibold))
                                if let archivedAt = product.archivedAt {
                                    Text("Archived \(Formatters.shortDate(archivedAt))")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            Spacer()
                            Text(Formatters.quantity(product.currentQuantity, unit: product.unit))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .swipeActions(edge: .leading, allowsFullSwipe: true) {
                            Button {
                                withAnimation { InventoryActions.restore(product, in: modelContext) }
                            } label: {
                                Label("Restore", systemImage: "arrow.uturn.up")
                            }
                            .tint(.green)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                pendingDeletion = product
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle("Archived Products")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog(
            "Permanently delete this product?",
            isPresented: Binding(
                get: { pendingDeletion != nil },
                set: { if !$0 { pendingDeletion = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Delete Permanently", role: .destructive) {
                if let product = pendingDeletion {
                    withAnimation { modelContext.delete(product) }
                }
                pendingDeletion = nil
            }
            Button("Cancel", role: .cancel) { pendingDeletion = nil }
        } message: {
            Text("This cannot be undone. Its past history entries will be kept, but the product itself will be gone.")
        }
    }
}

#Preview {
    NavigationStack {
        ArchivedProductsView()
    }
    .modelContainer(PersistenceController.previewContainer())
}

import SwiftUI
import SwiftData

struct HomeView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(filter: #Predicate<Product> { !$0.isArchived }, sort: \Product.name)
    private var products: [Product]

    @AppStorage(AppSettingsKey.notificationsEnabled) private var notificationsEnabled = false
    @AppStorage(AppSettingsKey.expiringSoonWindowDays) private var expiringSoonWindowDays = 3

    @State private var searchText = ""
    @State private var showingAddProduct = false
    @State private var quickAdjustProduct: Product?
    @State private var writeOffProduct: Product?
    @State private var editingProduct: Product?
    @State private var archivingProduct: Product?

    private var expiringSoon: [Product] {
        products
            .filter { $0.isExpiringSoon(within: expiringSoonWindowDays) || $0.isExpired }
            .sorted { ($0.daysUntilExpiration ?? .max) < ($1.daysUntilExpiration ?? .max) }
    }

    private var lowStock: [Product] {
        products
            .filter { $0.isLowStock || $0.isOutOfStock }
            .sorted { $0.currentQuantity < $1.currentQuantity }
    }

    private var filteredProducts: [Product] {
        guard !searchText.isEmpty else { return products }
        return products.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    private var groupedProducts: [(category: ProductCategory, items: [Product])] {
        let groups = Dictionary(grouping: filteredProducts) { $0.category }
        return groups
            .map { entry in
                (category: entry.key, items: entry.value.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending })
            }
            .sorted { $0.category.displayName < $1.category.displayName }
    }

    var body: some View {
        NavigationStack {
            List {
                if searchText.isEmpty {
                    if !expiringSoon.isEmpty || !lowStock.isEmpty {
                        attentionSection
                    } else if !products.isEmpty {
                        Section {
                            AllGoodBanner()
                                .listRowInsets(EdgeInsets())
                                .listRowSeparator(.hidden)
                                .listRowBackground(Color.clear)
                        }
                    }
                }

                if products.isEmpty {
                    emptyState
                } else {
                    ForEach(groupedProducts, id: \.category) { group in
                        Section(group.category.displayName) {
                            ForEach(group.items) { product in
                                productRow(product)
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Home")
            .searchable(text: $searchText, prompt: "Search products")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Haptics.light()
                        showingAddProduct = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                    }
                    .accessibilityLabel("Add Product")
                }
            }
            .sheet(isPresented: $showingAddProduct) {
                AddEditProductView(product: nil)
            }
            .sheet(item: $quickAdjustProduct) { product in
                QuickAdjustSheet(product: product)
            }
            .sheet(item: $editingProduct) { product in
                AddEditProductView(product: product)
            }
            .sheet(item: $writeOffProduct) { product in
                WriteOffSheet(product: product) { amount, reason in
                    withAnimation {
                        InventoryActions.writeOff(product, amount: amount, reason: reason, in: modelContext, notifyIfLowStock: notificationsEnabled)
                    }
                    writeOffProduct = nil
                }
            }
            .confirmationDialog(
                "Archive this product?",
                isPresented: Binding(
                    get: { archivingProduct != nil },
                    set: { if !$0 { archivingProduct = nil } }
                ),
                titleVisibility: .visible
            ) {
                Button("Archive", role: .destructive) {
                    if let product = archivingProduct {
                        withAnimation { InventoryActions.archive(product, in: modelContext) }
                    }
                    archivingProduct = nil
                }
                Button("Cancel", role: .cancel) { archivingProduct = nil }
            } message: {
                Text("It moves to Archived Products and can be restored later. Its history stays intact.")
            }
        }
    }

    private var attentionSection: some View {
        Group {
            if !expiringSoon.isEmpty {
                Section {
                    horizontalCarousel(expiringSoon) { product in
                        AttentionCard(
                            product: product,
                            highlight: expiryHighlight(product),
                            highlightColor: (product.daysUntilExpiration ?? 0) < 0 ? .red : .orange
                        ) {
                            quickAdjustProduct = product
                        }
                    }
                } header: {
                    Text("Expiring Soon")
                }
            }

            if !lowStock.isEmpty {
                Section {
                    horizontalCarousel(lowStock) { product in
                        AttentionCard(
                            product: product,
                            highlight: product.isOutOfStock ? "Out of stock" : "Low stock",
                            highlightColor: product.isOutOfStock ? .red : .orange
                        ) {
                            quickAdjustProduct = product
                        }
                    }
                } header: {
                    Text("Low Stock")
                }
            }
        }
    }

    private func horizontalCarousel<Content: View>(_ items: [Product], @ViewBuilder content: @escaping (Product) -> Content) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(items) { product in
                    content(product)
                }
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 2)
        }
        .listRowInsets(EdgeInsets())
        .listRowSeparator(.hidden)
        .listRowBackground(Color.clear)
    }

    private func productRow(_ product: Product) -> some View {
        ProductRow(product: product)
            .onTapGesture {
                quickAdjustProduct = product
            }
            .swipeActions(edge: .leading, allowsFullSwipe: true) {
                Button {
                    Haptics.light()
                    withAnimation {
                        InventoryActions.adjust(product, delta: product.unit.quickStep, in: modelContext, notifyIfLowStock: notificationsEnabled)
                    }
                } label: {
                    Label("+\(stepLabel(product.unit.quickStep))", systemImage: "plus")
                }
                .tint(.green)
            }
            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                Button(role: .destructive) {
                    writeOffProduct = product
                } label: {
                    Label("Write Off", systemImage: "trash")
                }

                Button {
                    Haptics.light()
                    withAnimation {
                        InventoryActions.adjust(product, delta: -product.unit.quickStep, in: modelContext, notifyIfLowStock: notificationsEnabled)
                    }
                } label: {
                    Label("-\(stepLabel(product.unit.quickStep))", systemImage: "minus")
                }
                .tint(.orange)
            }
            .contextMenu {
                Button {
                    quickAdjustProduct = product
                } label: {
                    Label("Adjust Quantity", systemImage: "slider.horizontal.3")
                }
                Button {
                    editingProduct = product
                } label: {
                    Label("Edit", systemImage: "pencil")
                }
                Button(role: .destructive) {
                    archivingProduct = product
                } label: {
                    Label("Archive", systemImage: "archivebox")
                }
            }
    }

    private var emptyState: some View {
        Section {
            VStack(spacing: 12) {
                Image(systemName: "shippingbox")
                    .font(.system(size: 44))
                    .foregroundStyle(.tertiary)
                Text("No products yet")
                    .font(.headline)
                Text("Tap + to add your first product.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 60)
            .listRowSeparator(.hidden)
        }
    }

    private func expiryHighlight(_ product: Product) -> String {
        guard let days = product.daysUntilExpiration else { return "" }
        if days < 0 { return "Expired" }
        if days == 0 { return "Today" }
        if days == 1 { return "Tomorrow" }
        return "\(days) days left"
    }

    private func stepLabel(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(value)) : String(format: "%.1f", value)
    }
}

#Preview {
    HomeView()
        .modelContainer(PersistenceController.previewContainer())
}

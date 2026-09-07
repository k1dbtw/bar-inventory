import SwiftUI
import SwiftData

struct QuickAdjustSheet: View {
    let product: Product

    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @AppStorage(AppSettingsKey.notificationsEnabled) private var notificationsEnabled = false

    @State private var initialQuantity: Double = 0
    @State private var showingWriteOff = false
    @State private var showingEdit = false
    @State private var showingArchiveConfirm = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    header
                    quantitySection
                    actionButtons
                }
                .padding(20)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .onAppear { initialQuantity = product.currentQuantity }
        .onDisappear { logAdjustmentIfNeeded() }
        .sheet(isPresented: $showingWriteOff) {
            WriteOffSheet(product: product) { amount, reason in
                InventoryActions.writeOff(product, amount: amount, reason: reason, in: modelContext, notifyIfLowStock: notificationsEnabled)
                initialQuantity = product.currentQuantity
                showingWriteOff = false
                dismiss()
            }
        }
        .sheet(isPresented: $showingEdit, onDismiss: { initialQuantity = product.currentQuantity }) {
            AddEditProductView(product: product)
        }
        .confirmationDialog("Archive this product?", isPresented: $showingArchiveConfirm, titleVisibility: .visible) {
            Button("Archive", role: .destructive) {
                InventoryActions.archive(product, in: modelContext)
                dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("It moves to Archived Products and can be restored later. Its history stays intact.")
        }
    }

    private var header: some View {
        VStack(spacing: 6) {
            CategoryIconBadge(category: product.category, size: 56)
            Text(product.name)
                .font(.title2.weight(.bold))
            Text(product.category.displayName)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            if let days = product.daysUntilExpiration {
                Text(Formatters.daysRemainingLabel(days))
                    .font(.caption.weight(.medium))
                    .foregroundStyle(days < 0 ? .red : (days <= 2 ? .orange : .secondary))
            }
        }
    }

    private var quantitySection: some View {
        VStack(spacing: 16) {
            Text(Formatters.quantity(product.currentQuantity, unit: product.unit))
                .font(.system(size: 40, weight: .bold, design: .rounded))
                .contentTransition(.numericText())
                .animation(.snappy, value: product.currentQuantity)

            HStack(spacing: 10) {
                stepButton(delta: -product.unit.largeStep, tint: .red)
                stepButton(delta: -product.unit.quickStep, tint: .red)
                stepButton(delta: product.unit.quickStep, tint: .green)
                stepButton(delta: product.unit.largeStep, tint: .green)
            }
        }
    }

    private func stepButton(delta: Double, tint: Color) -> some View {
        Button {
            Haptics.light()
            withAnimation(.snappy) {
                product.currentQuantity = max(0, product.currentQuantity + delta)
            }
        } label: {
            Text(stepLabel(delta))
                .font(.subheadline.weight(.semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(tint.opacity(0.14)))
                .foregroundStyle(tint)
        }
        .buttonStyle(.plain)
    }

    private var actionButtons: some View {
        VStack(spacing: 10) {
            Button {
                showingWriteOff = true
            } label: {
                Label("Write Off", systemImage: "trash.circle.fill")
                    .font(.body.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .tint(.red)
            .disabled(product.currentQuantity <= 0)

            Button {
                showingEdit = true
            } label: {
                Label("Edit Details", systemImage: "pencil")
                    .font(.body.weight(.medium))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.bordered)

            Button(role: .destructive) {
                showingArchiveConfirm = true
            } label: {
                Label("Archive Product", systemImage: "archivebox")
                    .font(.subheadline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
            }
        }
    }

    private func stepLabel(_ delta: Double) -> String {
        let sign = delta >= 0 ? "+" : "-"
        let magnitude = abs(delta)
        let numberString = product.unit.isWholeNumber || magnitude.truncatingRemainder(dividingBy: 1) == 0
            ? String(Int(magnitude))
            : String(format: "%.1f", magnitude)
        return "\(sign)\(numberString)"
    }

    private func logAdjustmentIfNeeded() {
        InventoryActions.logNetAdjustment(
            product,
            previousQuantity: initialQuantity,
            in: modelContext,
            notifyIfLowStock: notificationsEnabled
        )
    }
}

#Preview {
    let container = PersistenceController.previewContainer()
    let product = try! container.mainContext.fetch(FetchDescriptor<Product>()).first!
    return Text("Preview host")
        .sheet(isPresented: .constant(true)) {
            QuickAdjustSheet(product: product)
        }
        .modelContainer(container)
}

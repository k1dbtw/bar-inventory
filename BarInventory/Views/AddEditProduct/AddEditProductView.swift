import SwiftUI
import SwiftData

struct AddEditProductView: View {
    let product: Product?

    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @AppStorage(AppSettingsKey.notificationsEnabled) private var notificationsEnabled = false

    @State private var name: String
    @State private var category: ProductCategory
    @State private var unit: MeasurementUnit
    @State private var quantity: Double
    @State private var lowStockThreshold: Double
    @State private var hasExpiration: Bool
    @State private var expirationDate: Date
    @State private var notes: String

    @FocusState private var nameFieldFocused: Bool

    private let columns = [GridItem(.adaptive(minimum: 96), spacing: 8)]

    init(product: Product?) {
        self.product = product
        _name = State(initialValue: product?.name ?? "")
        _category = State(initialValue: product?.category ?? .other)
        _unit = State(initialValue: product?.unit ?? .pieces)
        _quantity = State(initialValue: product?.currentQuantity ?? MeasurementUnit.pieces.largeStep)
        _lowStockThreshold = State(initialValue: product?.lowStockThreshold ?? MeasurementUnit.pieces.largeStep)
        _hasExpiration = State(initialValue: product?.expirationDate != nil)
        _expirationDate = State(initialValue: product?.expirationDate ?? Calendar.current.date(byAdding: .day, value: 7, to: .now) ?? .now)
        _notes = State(initialValue: product?.notes ?? "")
    }

    private var isCreating: Bool { product == nil }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Product name", text: $name)
                        .font(.body.weight(.medium))
                        .focused($nameFieldFocused)
                }

                Section("Category") {
                    LazyVGrid(columns: columns, spacing: 8) {
                        ForEach(ProductCategory.allCases) { option in
                            Chip(
                                title: option.displayName,
                                symbolName: option.symbolName,
                                tint: option.tint,
                                isSelected: category == option
                            ) {
                                Haptics.light()
                                category = option
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Unit") {
                    Picker("Unit", selection: $unit) {
                        ForEach(MeasurementUnit.allCases) { option in
                            Text(option.displayName).tag(option)
                        }
                    }
                    .pickerStyle(.menu)
                    .onChange(of: unit) { _, newUnit in
                        guard isCreating else { return }
                        quantity = newUnit.largeStep
                        lowStockThreshold = newUnit.largeStep
                    }
                }

                Section("Starting Quantity") {
                    quantityRow(value: $quantity, step: unit.quickStep, tint: .accentColor)
                }

                Section {
                    quantityRow(value: $lowStockThreshold, step: unit.quickStep, tint: .orange)
                } header: {
                    Text("Low Stock Alert")
                } footer: {
                    Text("You'll see this product under Low Stock once it drops to or below this amount.")
                }

                Section {
                    Toggle("Track expiration date", isOn: $hasExpiration.animation())
                    if hasExpiration {
                        DatePicker("Expires on", selection: $expirationDate, displayedComponents: .date)
                    }
                } header: {
                    Text("Expiration")
                }

                Section("Notes") {
                    TextField("Optional notes", text: $notes, axis: .vertical)
                        .lineLimit(2...4)
                }
            }
            .navigationTitle(isCreating ? "New Product" : "Edit Product")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .fontWeight(.semibold)
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
        .onAppear {
            if isCreating {
                nameFieldFocused = true
            }
        }
    }

    private func quantityRow(value: Binding<Double>, step: Double, tint: Color) -> some View {
        HStack {
            Button {
                Haptics.light()
                value.wrappedValue = max(0, value.wrappedValue - step)
            } label: {
                Image(systemName: "minus.circle.fill")
                    .font(.title2)
            }
            .buttonStyle(.plain)
            .foregroundStyle(tint)

            Spacer()

            Text(Formatters.quantity(value.wrappedValue, unit: unit))
                .font(.title3.weight(.semibold))
                .contentTransition(.numericText())
                .animation(.snappy, value: value.wrappedValue)

            Spacer()

            Button {
                Haptics.light()
                value.wrappedValue += step
            } label: {
                Image(systemName: "plus.circle.fill")
                    .font(.title2)
            }
            .buttonStyle(.plain)
            .foregroundStyle(tint)
        }
    }

    private func save() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else { return }
        let finalExpiration = hasExpiration ? expirationDate : nil

        if let product {
            let previousQuantity = product.currentQuantity
            product.name = trimmedName
            product.category = category
            product.unit = unit
            product.currentQuantity = quantity
            product.lowStockThreshold = lowStockThreshold
            product.expirationDate = finalExpiration
            product.notes = notes

            if quantity != previousQuantity {
                InventoryActions.logNetAdjustment(
                    product,
                    previousQuantity: previousQuantity,
                    in: modelContext,
                    notifyIfLowStock: notificationsEnabled
                )
            } else {
                InventoryActions.logEdit(product, in: modelContext)
            }
        } else {
            InventoryActions.create(
                name: trimmedName,
                category: category,
                unit: unit,
                quantity: quantity,
                lowStockThreshold: lowStockThreshold,
                expirationDate: finalExpiration,
                notes: notes,
                in: modelContext
            )
            Haptics.success()
        }

        dismiss()
    }
}

#Preview {
    AddEditProductView(product: nil)
        .modelContainer(PersistenceController.previewContainer())
}

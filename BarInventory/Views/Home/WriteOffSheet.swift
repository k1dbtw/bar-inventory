import SwiftUI

struct WriteOffSheet: View {
    let product: Product
    var onConfirm: (Double, WriteOffReason) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var amount: Double
    @State private var selectedReason: WriteOffReason = .expired

    init(product: Product, onConfirm: @escaping (Double, WriteOffReason) -> Void) {
        self.product = product
        self.onConfirm = onConfirm
        let starting = min(product.unit.quickStep, max(product.currentQuantity, product.unit.quickStep))
        _amount = State(initialValue: starting)
    }

    private let columns = [GridItem(.adaptive(minimum: 104), spacing: 8)]

    var body: some View {
        NavigationStack {
            VStack(spacing: 28) {
                VStack(spacing: 8) {
                    CategoryIconBadge(category: product.category, size: 48)
                    Text(product.name)
                        .font(.headline)
                    Text("Currently \(Formatters.quantity(product.currentQuantity, unit: product.unit))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 8)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Reason")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                    LazyVGrid(columns: columns, spacing: 8) {
                        ForEach(WriteOffReason.allCases) { reason in
                            Chip(
                                title: reason.displayName,
                                symbolName: reason.symbolName,
                                tint: .red,
                                isSelected: selectedReason == reason
                            ) {
                                Haptics.light()
                                selectedReason = reason
                            }
                        }
                    }
                }

                VStack(spacing: 12) {
                    Text("Amount")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    HStack(spacing: 16) {
                        Button {
                            Haptics.light()
                            amount = max(product.unit.quickStep, amount - product.unit.quickStep)
                        } label: {
                            Image(systemName: "minus.circle.fill")
                                .font(.system(size: 32))
                        }

                        Text(Formatters.quantity(amount, unit: product.unit))
                            .font(.title2.weight(.bold))
                            .frame(minWidth: 100)
                            .contentTransition(.numericText())
                            .animation(.snappy, value: amount)

                        Button {
                            Haptics.light()
                            amount = min(product.currentQuantity, amount + product.unit.quickStep)
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 32))
                        }
                    }
                    .foregroundStyle(.red)

                    Button("Write off all (\(Formatters.quantity(product.currentQuantity, unit: product.unit)))") {
                        Haptics.light()
                        amount = product.currentQuantity
                    }
                    .font(.caption.weight(.medium))
                    .disabled(product.currentQuantity <= 0)
                }

                Spacer()

                Button {
                    Haptics.warning()
                    onConfirm(amount, selectedReason)
                } label: {
                    Text("Confirm Write-Off")
                        .font(.body.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
                .disabled(amount <= 0 || product.currentQuantity <= 0)
            }
            .padding(20)
            .navigationTitle("Write Off")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }
}

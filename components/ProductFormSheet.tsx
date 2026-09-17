"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_HUE,
  CATEGORY_LABELS,
  formatQuantity,
  UNIT_LABELS,
  UNIT_STEPS,
  UNITS,
  type Category,
  type Unit,
} from "@/lib/domain";
import type { ProductDTO, ProductInput } from "@/lib/inventory";
import { Sheet } from "./Sheet";

type Props = {
  open: boolean;
  product: ProductDTO | null;
  onClose: () => void;
  onSubmit: (input: ProductInput) => void;
  submitting?: boolean;
};

function emptyDraft(): ProductInput {
  return {
    name: "",
    category: "other",
    unit: "pcs",
    quantity: UNIT_STEPS.pcs.large,
    lowStockThreshold: UNIT_STEPS.pcs.large,
    expirationDate: null,
    notes: "",
  };
}

export function ProductFormSheet({ open, product, onClose, onSubmit, submitting }: Props) {
  const [draft, setDraft] = useState<ProductInput>(emptyDraft);
  const isEditing = Boolean(product);

  useEffect(() => {
    if (!open) return;
    setDraft(
      product
        ? {
            name: product.name,
            category: product.category,
            unit: product.unit,
            quantity: product.quantity,
            lowStockThreshold: product.lowStockThreshold,
            expirationDate: product.expirationDate,
            notes: product.notes,
          }
        : emptyDraft(),
    );
  }, [open, product]);

  const step = useMemo(() => UNIT_STEPS[draft.unit].quick, [draft.unit]);

  const update = (patch: Partial<ProductInput>) => setDraft((current) => ({ ...current, ...patch }));

  const changeUnit = (unit: Unit) => {
    if (isEditing) {
      update({ unit });
      return;
    }
    update({
      unit,
      quantity: UNIT_STEPS[unit].large,
      lowStockThreshold: UNIT_STEPS[unit].large,
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title={isEditing ? "Изменить продукт" : "Новый продукт"}>
      <div className="sheet__section">
        <input
          className="input-lg"
          placeholder="Название"
          value={draft.name}
          autoFocus={!isEditing}
          onChange={(event) => update({ name: event.target.value })}
        />
      </div>

      <div className="sheet__section">
        <div className="sheet__label">Категория</div>
        <div className="chips">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip chip--tinted${draft.category === category ? " chip--selected" : ""}`}
              style={{ ["--cat-hue" as string]: CATEGORY_HUE[category as Category] }}
              onClick={() => update({ category })}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </div>

      <div className="sheet__section">
        <div className="sheet__label">Единица</div>
        <div className="chips">
          {UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              className={`chip${draft.unit === unit ? " chip--selected" : ""}`}
              onClick={() => changeUnit(unit)}
            >
              {UNIT_LABELS[unit]}
            </button>
          ))}
        </div>
      </div>

      <div className="sheet__section">
        <div className="sheet__label">Остаток</div>
        <AmountStepper
          value={draft.quantity}
          unit={draft.unit}
          step={step}
          onChange={(quantity) => update({ quantity })}
        />
      </div>

      <div className="sheet__section">
        <div className="sheet__label">Предупреждать, когда останется</div>
        <AmountStepper
          value={draft.lowStockThreshold}
          unit={draft.unit}
          step={step}
          onChange={(lowStockThreshold) => update({ lowStockThreshold })}
        />
      </div>

      <div className="sheet__section">
        <div className="field">
          <span className="field__label">Срок годности</span>
          <button
            type="button"
            className="toggle"
            aria-pressed={draft.expirationDate !== null}
            aria-label="Отслеживать срок годности"
            onClick={() =>
              update({
                expirationDate:
                  draft.expirationDate === null
                    ? new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
                    : null,
              })
            }
          />
        </div>
        {draft.expirationDate !== null ? (
          <div className="field">
            <span className="field__label">Годен до</span>
            <input
              type="date"
              value={draft.expirationDate}
              onChange={(event) => update({ expirationDate: event.target.value || null })}
            />
          </div>
        ) : null}
      </div>

      <div className="sheet__section">
        <div className="field field--column">
          <span className="field__label" style={{ marginBottom: 6 }}>
            Заметка
          </span>
          <textarea
            rows={2}
            placeholder="Необязательно"
            value={draft.notes}
            onChange={(event) => update({ notes: event.target.value })}
          />
        </div>
      </div>

      <div className="sheet__section">
        <button
          type="button"
          className="btn btn--primary"
          disabled={draft.name.trim().length === 0 || submitting}
          onClick={() => onSubmit({ ...draft, name: draft.name.trim() })}
        >
          {isEditing ? "Сохранить" : "Добавить"}
        </button>
        <button type="button" className="btn btn--quiet" onClick={onClose}>
          Отмена
        </button>
      </div>
    </Sheet>
  );
}

function AmountStepper({
  value,
  unit,
  step,
  onChange,
}: {
  value: number;
  unit: Unit;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="stepper">
      <button
        type="button"
        className="step-btn step-btn--minus"
        aria-label="Меньше"
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, Math.round((value - step) * 1000) / 1000))}
      >
        <Minus size={19} strokeWidth={2.6} />
      </button>
      <span className="stepper__value">{formatQuantity(value, unit)}</span>
      <button
        type="button"
        className="step-btn step-btn--plus"
        aria-label="Больше"
        onClick={() => onChange(Math.round((value + step) * 1000) / 1000)}
      >
        <Plus size={19} strokeWidth={2.6} />
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Archive, Pencil, Trash2 } from "lucide-react";
import {
  CATEGORY_LABELS,
  expiryLabel,
  formatAmount,
  formatQuantity,
  UNIT_STEPS,
} from "@/lib/domain";
import type { ProductDTO } from "@/lib/inventory";
import { CategoryBadge } from "./CategoryIcon";
import { Sheet } from "./Sheet";

type Props = {
  product: ProductDTO | null;
  onClose: () => void;
  onAdjust: (delta: number) => void;
  onWriteOff: () => void;
  onEdit: () => void;
  onArchive: () => void;
};

export function QuickAdjustSheet({
  product,
  onClose,
  onAdjust,
  onWriteOff,
  onEdit,
  onArchive,
}: Props) {
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    if (!product) setConfirmArchive(false);
  }, [product]);

  if (!product) return null;

  const steps = UNIT_STEPS[product.unit];
  const deltas = [-steps.large, -steps.quick, steps.quick, steps.large];

  return (
    <Sheet open onClose={onClose}>
      <div style={{ display: "grid", justifyItems: "center", gap: 6, paddingTop: 4 }}>
        <CategoryBadge
          category={product.category}
          size={26}
          className="icon-badge icon-badge--lg"
        />
        <h2 className="sheet__title">{product.name}</h2>
        <p className="sheet__subtitle">{CATEGORY_LABELS[product.category]}</p>
        {product.daysLeft !== null ? (
          <p
            className={`sheet__subtitle ${
              product.daysLeft < 0 ? "text-red" : product.daysLeft <= 2 ? "text-orange" : ""
            }`}
          >
            {expiryLabel(product.daysLeft)}
          </p>
        ) : null}
      </div>

      <div className="sheet__section">
        <div className="quantity-display">{formatQuantity(product.quantity, product.unit)}</div>
        <div className="quantity-grid">
          {deltas.map((delta) => (
            <button
              key={delta}
              type="button"
              className={delta < 0 ? "minus" : "plus"}
              disabled={delta < 0 && product.quantity <= 0}
              onClick={() => onAdjust(delta)}
            >
              {delta > 0 ? "+" : "−"}
              {formatAmount(delta, product.unit)}
            </button>
          ))}
        </div>
      </div>

      <div className="sheet__section">
        <button
          type="button"
          className="btn btn--danger"
          disabled={product.quantity <= 0}
          onClick={onWriteOff}
        >
          <Trash2 size={18} /> Списать
        </button>
        <button type="button" className="btn" onClick={onEdit}>
          <Pencil size={18} /> Изменить
        </button>

        {confirmArchive ? (
          <>
            <p className="field__hint" style={{ textAlign: "center" }}>
              Продукт уйдёт в архив, история сохранится. Восстановить можно в настройках.
            </p>
            <button type="button" className="btn btn--danger" onClick={onArchive}>
              Да, в архив
            </button>
            <button type="button" className="btn btn--quiet" onClick={() => setConfirmArchive(false)}>
              Отмена
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn--destructive-text"
            onClick={() => setConfirmArchive(true)}
          >
            <Archive size={18} /> В архив
          </button>
        )}
      </div>
    </Sheet>
  );
}

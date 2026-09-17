"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  formatQuantity,
  REASON_LABELS,
  UNIT_STEPS,
  WRITE_OFF_REASONS,
  type WriteOffReason,
} from "@/lib/domain";
import type { ProductDTO } from "@/lib/inventory";
import { Sheet } from "./Sheet";

type Props = {
  product: ProductDTO | null;
  onClose: () => void;
  onConfirm: (amount: number, reason: WriteOffReason) => void;
};

export function WriteOffSheet({ product, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState<WriteOffReason>("expired");
  const [amount, setAmount] = useState(1);

  useEffect(() => {
    if (!product) return;
    const step = UNIT_STEPS[product.unit].quick;
    setAmount(Math.min(step, product.quantity) || step);
    setReason(product.daysLeft !== null && product.daysLeft < 0 ? "expired" : "spoiled");
  }, [product]);

  if (!product) return null;

  const step = UNIT_STEPS[product.unit].quick;

  return (
    <Sheet
      open
      onClose={onClose}
      title="Списание"
      subtitle={`${product.name} · сейчас ${formatQuantity(product.quantity, product.unit)}`}
    >
      <div className="sheet__section">
        <div className="sheet__label">Причина</div>
        <div className="chips">
          {WRITE_OFF_REASONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`chip${reason === option ? " chip--selected" : ""}`}
              onClick={() => setReason(option)}
            >
              {REASON_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="sheet__section">
        <div className="sheet__label">Сколько</div>
        <div className="stepper">
          <button
            type="button"
            className="step-btn step-btn--minus"
            aria-label="Меньше"
            disabled={amount <= step}
            onClick={() => setAmount((value) => Math.max(step, Math.round((value - step) * 1000) / 1000))}
          >
            <Minus size={19} strokeWidth={2.6} />
          </button>
          <span className="stepper__value">{formatQuantity(amount, product.unit)}</span>
          <button
            type="button"
            className="step-btn step-btn--plus"
            aria-label="Больше"
            disabled={amount >= product.quantity}
            onClick={() =>
              setAmount((value) =>
                Math.min(product.quantity, Math.round((value + step) * 1000) / 1000),
              )
            }
          >
            <Plus size={19} strokeWidth={2.6} />
          </button>
        </div>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => setAmount(product.quantity)}
        >
          Списать всё ({formatQuantity(product.quantity, product.unit)})
        </button>
      </div>

      <div className="sheet__section">
        <button
          type="button"
          className="btn btn--danger"
          disabled={amount <= 0 || product.quantity <= 0}
          onClick={() => onConfirm(amount, reason)}
        >
          Списать
        </button>
        <button type="button" className="btn btn--quiet" onClick={onClose}>
          Отмена
        </button>
      </div>
    </Sheet>
  );
}

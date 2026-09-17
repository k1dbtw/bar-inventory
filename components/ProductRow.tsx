"use client";

import { Minus, Plus } from "lucide-react";
import { formatQuantity, shortExpiryLabel, UNIT_STEPS } from "@/lib/domain";
import type { ProductDTO } from "@/lib/inventory";
import { CategoryBadge } from "./CategoryIcon";

type Props = {
  product: ProductDTO;
  onOpen: () => void;
  onAdjust: (delta: number) => void;
};

export function ProductRow({ product, onOpen, onAdjust }: Props) {
  const step = UNIT_STEPS[product.unit].quick;
  const expiry =
    product.daysLeft !== null && product.daysLeft <= 7 ? shortExpiryLabel(product.daysLeft) : null;
  const expiryClass =
    product.daysLeft === null
      ? ""
      : product.daysLeft < 0
        ? " text-red"
        : product.daysLeft <= 2
          ? " text-orange"
          : "";

  return (
    <div className="row">
      <button type="button" className="row__main" onClick={onOpen}>
        <CategoryBadge category={product.category} />
        <span className="row__text">
          <span className="row__name">{product.name}</span>
          <span className="row__meta">
            <span className={`dot dot--${product.status}`} />
            {formatQuantity(product.quantity, product.unit)}
            {expiry ? (
              <>
                <span className="text-secondary">·</span>
                <span className={expiryClass.trim()}>{expiry}</span>
              </>
            ) : null}
          </span>
        </span>
      </button>

      <div className="row__actions">
        <button
          type="button"
          className="step-btn step-btn--minus"
          aria-label={`Убавить ${product.name}`}
          disabled={product.quantity <= 0}
          onClick={() => onAdjust(-step)}
        >
          <Minus size={19} strokeWidth={2.6} />
        </button>
        <button
          type="button"
          className="step-btn step-btn--plus"
          aria-label={`Добавить ${product.name}`}
          onClick={() => onAdjust(step)}
        >
          <Plus size={19} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}

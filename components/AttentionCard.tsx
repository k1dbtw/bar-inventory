"use client";

import { formatQuantity } from "@/lib/domain";
import type { ProductDTO } from "@/lib/inventory";
import { CategoryBadge } from "./CategoryIcon";

type Props = {
  product: ProductDTO;
  highlight: string;
  tone: "red" | "orange";
  onOpen: () => void;
};

export function AttentionCard({ product, highlight, tone, onOpen }: Props) {
  return (
    <button type="button" className="attention" onClick={onOpen}>
      <CategoryBadge
        category={product.category}
        size={17}
        className="icon-badge icon-badge--sm"
      />
      <span>
        <span className="attention__name">{product.name}</span>
        <span className={`attention__highlight text-${tone}`} style={{ display: "block" }}>
          {highlight}
        </span>
      </span>
      <span className="attention__qty">{formatQuantity(product.quantity, product.unit)}</span>
    </button>
  );
}

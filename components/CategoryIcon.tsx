import type { CSSProperties } from "react";
import {
  Apple,
  Coffee,
  Croissant,
  CupSoda,
  FlaskConical,
  GlassWater,
  Milk,
  Package,
  Wine,
} from "lucide-react";
import { CATEGORY_HUE, type Category } from "@/lib/domain";

const ICONS: Record<Category, typeof Coffee> = {
  coffee: Coffee,
  dairy: Milk,
  syrup: FlaskConical,
  juice: CupSoda,
  fruit: Apple,
  alcohol: Wine,
  soft: GlassWater,
  bakery: Croissant,
  other: Package,
};

export function categoryStyle(category: Category): CSSProperties {
  return { "--cat-hue": CATEGORY_HUE[category] } as CSSProperties;
}

export function CategoryIcon({ category, size = 20 }: { category: Category; size?: number }) {
  const Icon = ICONS[category];
  return <Icon size={size} strokeWidth={2.1} />;
}

export function CategoryBadge({
  category,
  size = 20,
  className = "icon-badge",
}: {
  category: Category;
  size?: number;
  className?: string;
}) {
  return (
    <span className={className} style={categoryStyle(category)}>
      <CategoryIcon category={category} size={size} />
    </span>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ArrowUp,
  Clock,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  Undo2,
} from "lucide-react";
import { TabBar } from "@/components/TabBar";
import {
  CHANGE_TYPE_LABELS,
  formatQuantity,
  REASON_LABELS,
  type ChangeType,
} from "@/lib/domain";
import type { HistoryDTO } from "@/lib/inventory";
import { useHistory } from "@/lib/client/hooks";

const FILTERS: { value: ChangeType | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "write_off", label: "Списания" },
  { value: "restock", label: "Пополнения" },
  { value: "adjustment", label: "Изменения" },
];

const ICONS: Record<ChangeType, React.ComponentType<{ size?: number }>> = {
  created: Plus,
  restock: ArrowUp,
  adjustment: SlidersHorizontal,
  write_off: Trash2,
  edited: Pencil,
  archived: Archive,
  restored: Undo2,
};

const TONES: Record<ChangeType, string> = {
  created: "var(--blue)",
  restock: "var(--green)",
  adjustment: "var(--orange)",
  write_off: "var(--red)",
  edited: "var(--blue)",
  archived: "var(--text-secondary)",
  restored: "var(--green)",
};

export default function HistoryPage() {
  const { data, isLoading } = useHistory();
  const [filter, setFilter] = useState<ChangeType | "all">("all");

  const grouped = useMemo(() => {
    const entries = (data ?? []).filter(
      (entry) => filter === "all" || entry.changeType === filter,
    );
    const groups = new Map<string, HistoryDTO[]>();
    for (const entry of entries) {
      const key = entry.createdAt.slice(0, 10);
      const list = groups.get(key) ?? [];
      list.push(entry);
      groups.set(key, list);
    }
    return [...groups.entries()];
  }, [data, filter]);

  return (
    <div className="app">
      <div className="screen">
        <header className="header">
          <div>
            <h1 className="header__title">История</h1>
            <p className="header__subtitle">Все движения по бару</p>
          </div>
        </header>

        <div className="section">
          <div className="chips">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chip${filter === option.value ? " chip--selected" : ""}`}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? <div className="spinner" /> : null}

        {!isLoading && grouped.length === 0 ? (
          <div className="empty">
            <Clock size={44} strokeWidth={1.5} />
            <p className="empty__title">Пока пусто</p>
            <p className="empty__text">Здесь появятся списания, пополнения и правки.</p>
          </div>
        ) : null}

        {grouped.map(([day, entries]) => (
          <section className="section" key={day}>
            <h2 className="section__title">{formatDay(day)}</h2>
            <div className="list-group">
              {entries.map((entry) => {
                const Icon = ICONS[entry.changeType];
                return (
                  <div className="list-item" key={entry.id}>
                    <span style={{ color: TONES[entry.changeType], display: "flex" }}>
                      <Icon size={20} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="list-item__title">{entry.productName}</div>
                      <div className="list-item__subtitle">
                        {CHANGE_TYPE_LABELS[entry.changeType]}
                        {entry.quantityDelta !== 0
                          ? ` · ${entry.quantityDelta > 0 ? "+" : "−"}${formatQuantity(
                              Math.abs(entry.quantityDelta),
                              entry.unit,
                            )}`
                          : ""}
                        {entry.reason ? ` · ${REASON_LABELS[entry.reason]}` : ""}
                      </div>
                    </div>
                    <span className="list-item__subtitle">{formatTime(entry.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <TabBar />
    </div>
  );
}

function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(date, today)) return "Сегодня";
  if (same(date, yesterday)) return "Вчера";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

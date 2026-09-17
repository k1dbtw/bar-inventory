"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Undo2 } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryIcon";
import { TabBar } from "@/components/TabBar";
import { formatQuantity } from "@/lib/domain";
import {
  useArchivedProducts,
  useDeleteProduct,
  useRestoreProduct,
} from "@/lib/client/hooks";

export default function ArchivePage() {
  const { data, isLoading } = useArchivedProducts();
  const restore = useRestoreProduct();
  const remove = useDeleteProduct();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const products = data ?? [];

  return (
    <div className="app">
      <div className="screen">
        <header className="header">
          <div>
            <Link href="/settings" className="header__subtitle" style={{ textDecoration: "none" }}>
              ‹ Настройки
            </Link>
            <h1 className="header__title">Архив</h1>
          </div>
        </header>

        {isLoading ? <div className="spinner" /> : null}

        {!isLoading && products.length === 0 ? (
          <div className="empty">
            <Archive size={44} strokeWidth={1.5} />
            <p className="empty__title">Архив пуст</p>
            <p className="empty__text">Сюда попадают продукты, которые ты убрал с главного экрана.</p>
          </div>
        ) : null}

        {products.map((product) => (
          <section className="section" key={product.id}>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CategoryBadge category={product.category} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-item__title">{product.name}</div>
                  <div className="list-item__subtitle">
                    {formatQuantity(product.quantity, product.unit)}
                    {product.archivedAt
                      ? ` · в архиве с ${new Date(product.archivedAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })}`
                      : ""}
                  </div>
                </div>
              </div>

              {confirmId === product.id ? (
                <>
                  <p className="field__hint" style={{ padding: "10px 0 0" }}>
                    Удалить навсегда? История списаний по этому продукту останется.
                  </p>
                  <button
                    type="button"
                    className="btn btn--danger"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      remove.mutate(product.id);
                      setConfirmId(null);
                    }}
                  >
                    Удалить навсегда
                  </button>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={() => setConfirmId(null)}
                  >
                    Отмена
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => restore.mutate(product.id)}
                  >
                    <Undo2 size={18} /> Вернуть
                  </button>
                  <button
                    type="button"
                    className="btn btn--destructive-text"
                    onClick={() => setConfirmId(product.id)}
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
      <TabBar />
    </div>
  );
}

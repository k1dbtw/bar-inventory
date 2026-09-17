"use client";

import { useMemo, useState } from "react";
import { CircleCheck, PackageOpen, Plus, Search } from "lucide-react";
import { AttentionCard } from "@/components/AttentionCard";
import { ProductFormSheet } from "@/components/ProductFormSheet";
import { ProductRow } from "@/components/ProductRow";
import { QuickAdjustSheet } from "@/components/QuickAdjustSheet";
import { TabBar } from "@/components/TabBar";
import { WriteOffSheet } from "@/components/WriteOffSheet";
import {
  CATEGORY_LABELS,
  shortExpiryLabel,
  type Category,
  type WriteOffReason,
} from "@/lib/domain";
import type { ProductDTO, ProductInput } from "@/lib/inventory";
import {
  useAdjust,
  useAppState,
  useArchiveProduct,
  useCreateProduct,
  useUpdateProduct,
  useWriteOff,
} from "@/lib/client/hooks";

export default function HomePage() {
  const { data, isLoading } = useAppState();
  const adjust = useAdjust();
  const writeOff = useWriteOff();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const archiveProduct = useArchiveProduct();

  const [search, setSearch] = useState("");
  const [quickId, setQuickId] = useState<string | null>(null);
  const [writeOffId, setWriteOffId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const products = data?.products ?? [];
  const settings = data?.settings;

  const byId = (id: string | null): ProductDTO | null =>
    id ? (products.find((product) => product.id === id) ?? null) : null;

  const expiring = useMemo(
    () =>
      products
        .filter(
          (product) =>
            product.daysLeft !== null &&
            product.daysLeft <= (settings?.expiringSoonWindowDays ?? 3),
        )
        .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0)),
    [products, settings?.expiringSoonWindowDays],
  );

  const low = useMemo(
    () => products.filter((product) => product.status !== "ok").sort((a, b) => a.quantity - b.quantity),
    [products],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => product.name.toLowerCase().includes(term));
  }, [products, search]);

  const grouped = useMemo(() => {
    const groups = new Map<Category, ProductDTO[]>();
    for (const product of filtered) {
      const list = groups.get(product.category) ?? [];
      list.push(product);
      groups.set(product.category, list);
    }
    return [...groups.entries()].sort((a, b) =>
      CATEGORY_LABELS[a[0]].localeCompare(CATEGORY_LABELS[b[0]], "ru"),
    );
  }, [filtered]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2200);
  };

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handleSubmit = (input: ProductInput) => {
    if (editingId) {
      updateProduct.mutate(
        { id: editingId, input },
        {
          onSuccess: () => {
            setEditingId(null);
            showToast("Сохранено");
          },
        },
      );
      return;
    }
    createProduct.mutate(input, {
      onSuccess: () => {
        setCreating(false);
        showToast("Продукт добавлен");
      },
    });
  };

  return (
    <div className="app">
      <div className="screen">
        <header className="header">
          <div>
            <h1 className="header__title">Бар</h1>
            <p className="header__subtitle">{today}</p>
          </div>
          <button
            type="button"
            className="header__action"
            aria-label="Добавить продукт"
            onClick={() => setCreating(true)}
          >
            <Plus size={22} strokeWidth={2.4} />
          </button>
        </header>

        <div className="search">
          <Search size={17} />
          <input
            placeholder="Поиск"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {isLoading ? <div className="spinner" /> : null}

        {!isLoading && search.trim() === "" ? (
          <>
            {expiring.length > 0 ? (
              <section className="section">
                <h2 className="section__title">Скоро испортится</h2>
                <div className="carousel">
                  {expiring.map((product) => (
                    <AttentionCard
                      key={product.id}
                      product={product}
                      highlight={shortExpiryLabel(product.daysLeft ?? 0)}
                      tone={(product.daysLeft ?? 0) < 0 ? "red" : "orange"}
                      onOpen={() => setQuickId(product.id)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {low.length > 0 ? (
              <section className="section">
                <h2 className="section__title">Заканчивается</h2>
                <div className="carousel">
                  {low.map((product) => (
                    <AttentionCard
                      key={product.id}
                      product={product}
                      highlight={product.status === "out" ? "Закончилось" : "Мало"}
                      tone={product.status === "out" ? "red" : "orange"}
                      onOpen={() => setQuickId(product.id)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {products.length > 0 && expiring.length === 0 && low.length === 0 ? (
              <section className="section">
                <div className="banner">
                  <CircleCheck size={26} className="text-green" />
                  <div>
                    <div className="banner__title">Всё в порядке</div>
                    <div className="banner__text">Ничего не заканчивается и не портится.</div>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {!isLoading && products.length === 0 ? (
          <div className="empty">
            <PackageOpen size={44} strokeWidth={1.5} />
            <p className="empty__title">Пока пусто</p>
            <p className="empty__text">Нажми «плюс», чтобы добавить первый продукт.</p>
          </div>
        ) : null}

        {grouped.map(([category, items]) => (
          <section className="section" key={category}>
            <h2 className="section__title">{CATEGORY_LABELS[category]}</h2>
            <div className="rows">
              {items.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onOpen={() => setQuickId(product.id)}
                  onAdjust={(delta) => adjust.mutate({ id: product.id, delta })}
                />
              ))}
            </div>
          </section>
        ))}

        {!isLoading && products.length > 0 && filtered.length === 0 ? (
          <div className="empty">
            <p className="empty__title">Ничего не найдено</p>
            <p className="empty__text">Попробуй другое название.</p>
          </div>
        ) : null}
      </div>

      <QuickAdjustSheet
        product={byId(quickId)}
        onClose={() => setQuickId(null)}
        onAdjust={(delta) => quickId && adjust.mutate({ id: quickId, delta })}
        onWriteOff={() => {
          setWriteOffId(quickId);
          setQuickId(null);
        }}
        onEdit={() => {
          setEditingId(quickId);
          setQuickId(null);
        }}
        onArchive={() => {
          if (!quickId) return;
          archiveProduct.mutate(quickId, { onSuccess: () => showToast("Убрано в архив") });
          setQuickId(null);
        }}
      />

      <WriteOffSheet
        product={byId(writeOffId)}
        onClose={() => setWriteOffId(null)}
        onConfirm={(amount: number, reason: WriteOffReason) => {
          if (!writeOffId) return;
          writeOff.mutate(
            { id: writeOffId, amount, reason },
            { onSuccess: () => showToast("Списано") },
          );
          setWriteOffId(null);
        }}
      />

      <ProductFormSheet
        open={creating || editingId !== null}
        product={byId(editingId)}
        submitting={createProduct.isPending || updateProduct.isPending}
        onClose={() => {
          setCreating(false);
          setEditingId(null);
        }}
        onSubmit={handleSubmit}
      />

      {toast ? <div className="toast">{toast}</div> : null}

      <TabBar />
    </div>
  );
}

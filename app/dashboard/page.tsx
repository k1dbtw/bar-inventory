"use client";

import { ArrowDown, Clock, Package, Trash2, TriangleAlert } from "lucide-react";
import { TabBar } from "@/components/TabBar";
import { useStats } from "@/lib/client/hooks";

export default function DashboardPage() {
  const { data, isLoading } = useStats();
  const maxCount = Math.max(1, ...(data?.chart.map((point) => point.count) ?? [1]));

  return (
    <div className="app">
      <div className="screen">
        <header className="header">
          <div>
            <h1 className="header__title">Отчёт</h1>
            <p className="header__subtitle">Что происходит с баром</p>
          </div>
        </header>

        {isLoading || !data ? (
          <div className="spinner" />
        ) : (
          <>
            <section className="section">
              <div className="stats-grid">
                <Stat
                  label="Всего продуктов"
                  value={data.totalProducts}
                  tone="var(--blue)"
                  icon={<Package size={17} />}
                />
                <Stat
                  label="Заканчивается"
                  value={data.lowStockCount}
                  tone="var(--orange)"
                  icon={<ArrowDown size={17} />}
                />
                <Stat
                  label="Скоро испортится"
                  value={data.expiringSoonCount}
                  tone="var(--red)"
                  icon={<Clock size={17} />}
                />
                <Stat
                  label="Списаний за неделю"
                  value={data.writeOffsThisWeek}
                  tone="var(--text-secondary)"
                  icon={<Trash2 size={17} />}
                />
              </div>
            </section>

            <section className="section">
              <h2 className="section__title">Списания за 7 дней</h2>
              <div className="card" style={{ padding: 16 }}>
                {data.writeOffsThisWeek === 0 ? (
                  <p className="empty__text" style={{ textAlign: "center", padding: "32px 0" }}>
                    За последнюю неделю ничего не списывали.
                  </p>
                ) : (
                  <div className="chart">
                    {data.chart.map((point) => (
                      <div className="chart__col" key={point.date}>
                        <div
                          className={`chart__bar${point.count === 0 ? " chart__bar--empty" : ""}`}
                          style={{ height: `${(point.count / maxCount) * 100}%` }}
                          title={`${point.count}`}
                        />
                        <span className="chart__label">{weekday(point.date)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {data.topWasted ? (
              <section className="section">
                <div className="banner">
                  <TriangleAlert size={24} className="text-orange" />
                  <div>
                    <div className="banner__text">Чаще всего списывали</div>
                    <div className="banner__title">
                      {data.topWasted.name} · {data.topWasted.count}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat">
      <div
        className="stat__icon"
        style={{ background: `color-mix(in srgb, ${tone} 16%, transparent)`, color: tone }}
      >
        {icon}
      </div>
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function weekday(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString("ru-RU", { weekday: "short" });
}

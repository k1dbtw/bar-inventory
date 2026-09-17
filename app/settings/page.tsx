"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Check, ChevronRight, LogOut, Minus, Plus, Send } from "lucide-react";
import { TabBar } from "@/components/TabBar";
import { pluralDays } from "@/lib/domain";
import { api } from "@/lib/client/api";
import { useAppState, useUpdateSettings } from "@/lib/client/hooks";

type Theme = "system" | "light" | "dark";

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  localStorage.setItem("bi_theme", theme);
}

export default function SettingsPage() {
  const router = useRouter();
  const { data, isLoading } = useAppState();
  const updateSettings = useUpdateSettings();
  const settings = data?.settings;
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("bi_theme") as Theme | null) ?? settings?.theme ?? "system";
    setTheme(stored);
  }, [settings?.theme]);

  const changeTheme = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
    updateSettings.mutate({ theme: next });
  };

  const logout = async () => {
    await api.logout();
    router.replace("/login");
  };

  return (
    <div className="app">
      <div className="screen">
        <header className="header">
          <div>
            <h1 className="header__title">Настройки</h1>
          </div>
        </header>

        {isLoading || !settings ? (
          <div className="spinner" />
        ) : (
          <>
            <section className="section">
              <h2 className="section__title">Оформление</h2>
              <div className="segmented">
                {(
                  [
                    ["system", "Система"],
                    ["light", "Светлая"],
                    ["dark", "Тёмная"],
                  ] as [Theme, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={theme === value}
                    onClick={() => changeTheme(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="section">
              <h2 className="section__title">Уведомления в Telegram</h2>
              {settings.telegramLinked ? (
                <>
                  <div className="field">
                    <span className="field__label">Чат подключён</span>
                    <span className="text-secondary" style={{ display: "flex", gap: 6 }}>
                      {settings.telegramName ? `@${settings.telegramName}` : ""}
                      <Check size={18} className="text-green" />
                    </span>
                  </div>
                  <div className="field">
                    <span className="field__label">Когда мало осталось</span>
                    <button
                      type="button"
                      className="toggle"
                      aria-label="Уведомлять, когда продукт заканчивается"
                      aria-pressed={settings.lowStockAlertsEnabled}
                      onClick={() =>
                        updateSettings.mutate({
                          lowStockAlertsEnabled: !settings.lowStockAlertsEnabled,
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <span className="field__label">Утренняя сводка</span>
                    <button
                      type="button"
                      className="toggle"
                      aria-label="Присылать сводку раз в день"
                      aria-pressed={settings.dailyDigestEnabled}
                      onClick={() =>
                        updateSettings.mutate({
                          dailyDigestEnabled: !settings.dailyDigestEnabled,
                        })
                      }
                    />
                  </div>
                  {settings.dailyDigestEnabled ? (
                    <StepperField
                      label="Время сводки"
                      value={`${String(settings.dailyDigestHour).padStart(2, "0")}:00`}
                      onDecrement={() =>
                        updateSettings.mutate({
                          dailyDigestHour: Math.max(0, settings.dailyDigestHour - 1),
                        })
                      }
                      onIncrement={() =>
                        updateSettings.mutate({
                          dailyDigestHour: Math.min(23, settings.dailyDigestHour + 1),
                        })
                      }
                    />
                  ) : null}
                  <StepperField
                    label="Предупреждать о сроке за"
                    value={`${settings.expirationReminderDays} ${pluralDays(
                      settings.expirationReminderDays,
                    )}`}
                    onDecrement={() =>
                      updateSettings.mutate({
                        expirationReminderDays: Math.max(0, settings.expirationReminderDays - 1),
                      })
                    }
                    onIncrement={() =>
                      updateSettings.mutate({
                        expirationReminderDays: Math.min(30, settings.expirationReminderDays + 1),
                      })
                    }
                  />
                  <p className="field__hint">
                    Часовой пояс: {settings.timezone}.{" "}
                    <button
                      type="button"
                      className="text-secondary"
                      style={{ textDecoration: "underline" }}
                      onClick={() =>
                        updateSettings.mutate({
                          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        })
                      }
                    >
                      Определить по телефону
                    </button>
                  </p>
                </>
              ) : (
                <div className="card" style={{ padding: 16 }}>
                  <div className="banner__title" style={{ marginBottom: 6 }}>
                    Чат ещё не подключён
                  </div>
                  <p className="banner__text" style={{ margin: 0 }}>
                    Открой бота в Telegram, отправь <b>/start</b> и пришли код доступа — после
                    этого уведомления о сроках и остатках будут приходить в чат.
                  </p>
                  {settings.botUsername ? (
                    <a
                      className="btn btn--primary"
                      style={{ marginTop: 12 }}
                      href={`https://t.me/${settings.botUsername}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Send size={18} /> Открыть бота
                    </a>
                  ) : null}
                </div>
              )}
            </section>

            <section className="section">
              <h2 className="section__title">Главный экран</h2>
              <StepperField
                label="Показывать за"
                value={`${settings.expiringSoonWindowDays} ${pluralDays(
                  settings.expiringSoonWindowDays,
                )}`}
                onDecrement={() =>
                  updateSettings.mutate({
                    expiringSoonWindowDays: Math.max(1, settings.expiringSoonWindowDays - 1),
                  })
                }
                onIncrement={() =>
                  updateSettings.mutate({
                    expiringSoonWindowDays: Math.min(30, settings.expiringSoonWindowDays + 1),
                  })
                }
              />
              <p className="field__hint">
                За сколько дней до срока годности продукт попадает в блок «Скоро испортится».
              </p>
            </section>

            <section className="section">
              <h2 className="section__title">Данные</h2>
              <div className="list-group">
                <Link className="list-item" href="/settings/archive">
                  <Archive size={20} className="text-secondary" />
                  <span className="list-item__title" style={{ flex: 1 }}>
                    Архив продуктов
                  </span>
                  <ChevronRight size={18} className="text-tertiary" />
                </Link>
              </div>
            </section>

            <section className="section">
              <button type="button" className="btn btn--destructive-text" onClick={logout}>
                <LogOut size={18} /> Выйти
              </button>
              <p className="field__hint" style={{ textAlign: "center" }}>
                Bar Inventory · версия 2.0
              </p>
            </section>
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}

function StepperField({
  label,
  value,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button type="button" className="step-btn" aria-label="Меньше" onClick={onDecrement}>
          <Minus size={17} strokeWidth={2.6} />
        </button>
        <span style={{ minWidth: 72, textAlign: "center", fontWeight: 600 }}>{value}</span>
        <button type="button" className="step-btn" aria-label="Больше" onClick={onIncrement}>
          <Plus size={17} strokeWidth={2.6} />
        </button>
      </span>
    </div>
  );
}

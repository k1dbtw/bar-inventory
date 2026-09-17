"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(code);
      router.replace("/");
    } catch {
      setError("Неверный код");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="login" onSubmit={submit}>
      <div>
        <h1 className="header__title">Bar Inventory</h1>
        <p className="header__subtitle">Остатки, списания и сроки годности</p>
      </div>

      <input
        className="input-lg"
        type="password"
        inputMode="text"
        autoComplete="current-password"
        placeholder="Код доступа"
        value={code}
        onChange={(event) => setCode(event.target.value)}
      />

      {error ? <p className="text-red">{error}</p> : null}

      <button type="submit" className="btn btn--primary" disabled={busy}>
        Войти
      </button>

      <p className="field__hint" style={{ textAlign: "center" }}>
        Код задаётся при развёртывании в переменной ACCESS_CODE. Ссылку для входа также
        присылает Telegram-бот по команде /app.
      </p>
    </form>
  );
}

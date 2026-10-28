import { useEffect, useRef, useState } from "react";
import type { GameMode } from "@black-city/shared";

const games: { mode: GameMode; title: string; subtitle: string; symbol: string }[] = [
  { mode: "CRASH", title: "CRASH", subtitle: "Успей забрать выигрыш", symbol: "↗" },
  { mode: "DICE", title: "DICE", subtitle: "Испытай удачу в костях", symbol: "⚄" },
  { mode: "MINES", title: "MINES", subtitle: "Найди безопасный путь", symbol: "✳" },
  { mode: "PLINKO", title: "PLINKO", subtitle: "Путь сквозь препятствия", symbol: "⌁" },
  { mode: "COINFLIP", title: "COINFLIP", subtitle: "Орёл или решка", symbol: "◉" },
  { mode: "WHEEL", title: "WHEEL", subtitle: "Колесо виртуальных кредитов", symbol: "◌" },
  { mode: "LUCKY", title: "LUCKY", subtitle: "Быстрый раунд", symbol: "✦" },
  { mode: "TOWER", title: "TOWER", subtitle: "Поднимайся выше", symbol: "▥" },
  { mode: "WHEEL_MINI", title: "WHEEL MINI", subtitle: "Компактное колесо", symbol: "◍" },
  { mode: "WHEEL_MEGA", title: "WHEEL MEGA", subtitle: "Большое колесо", symbol: "◎" },
  { mode: "CRAZY_TIME", title: "CRAZY TIME", subtitle: "Большое игровое шоу", symbol: "✺" },
  { mode: "SLOTS", title: "SLOTS", subtitle: "Классические слоты", symbol: "▦" },
];

type RoundResult = { headline: string; detail: string; payout: number };

function playDemoRound(mode: GameMode, stake: number, coinSide: "Орёл" | "Решка"): RoundResult {
  const random = (max: number) => Math.floor(Math.random() * max);
  const win = (headline: string, detail: string, multiplier: number): RoundResult => ({ headline, detail, payout: Math.floor(stake * multiplier) });
  const lose = (headline: string, detail: string): RoundResult => ({ headline, detail, payout: 0 });
  switch (mode) {
    case "DICE": {
      const roll = random(6) + 1;
      return roll >= 4 ? win("Выпало " + roll + " — победа!", "Нужно выбросить 4, 5 или 6.", 1.9) : lose("Выпало " + roll + " — мимо", "В этот раз нужно было больше.");
    }
    case "COINFLIP": {
      const side = random(2) ? "Орёл" : "Решка";
      return side === coinSide ? win(side + "! Ты угадал.", "Монета остановилась выбранной стороной.", 1.9) : lose(side + " — не угадал", "Ты выбрал: " + coinSide + ".");
    }
    case "LUCKY": {
      const number = random(100) + 1;
      return number > 50 ? win("Число " + number + " — удача!", "Побеждает число от 51 до 100.", 1.9) : lose("Число " + number, "Для победы нужно число выше 50.");
    }
    case "PLINKO": {
      const slots = [0, 0.5, 0.5, 1, 1, 1.5, 2, 3, 5];
      const multiplier = slots[random(slots.length)] ?? 0;
      return multiplier > 0 ? win("Множитель ×" + multiplier, "Шарик попал в этот сектор.", multiplier) : lose("Шарик попал в ×0", "В этом секторе выплата равна нулю.");
    }
    case "WHEEL":
    case "WHEEL_MINI":
    case "WHEEL_MEGA":
    case "CRAZY_TIME": {
      const sectors = mode === "WHEEL_MINI" ? [0, 0.5, 1, 1.5, 2] : mode === "WHEEL_MEGA" ? [0, 0, 1, 2, 3, 5, 10] : mode === "CRAZY_TIME" ? [0, 1, 2, 2, 5, 10, 20] : [0, 0.5, 1, 2, 3, 5];
      const multiplier = sectors[random(sectors.length)] ?? 0;
      return multiplier > 0 ? win("Колесо: ×" + multiplier, "Раунд завершён. Выплата рассчитана по сектору.", multiplier) : lose("Колесо: Банкрот", "Выплата в этом секторе равна нулю.");
    }
    case "MINES": {
      return random(100) < 65 ? win("Клетка безопасна!", "Ты нашёл безопасную клетку в демо-раунде.", 1.45) : lose("Мина!", "Попробуй ещё раз с новой ставкой.");
    }
    case "TOWER": {
      const floors = random(5) + 1;
      return floors >= 3 ? win("Ты прошёл " + floors + " этажей", "В демо-раунде удалось подняться достаточно высоко.", 1 + floors * 0.35) : lose("Остановка на " + floors + " этаже", "Башня оказалась слишком рискованной.");
    }
    case "CRASH": {
      const crashAt = Math.max(1, Math.floor((1 / Math.max(Math.random(), 0.08)) * 10) / 10);
      return crashAt >= 2 ? win("Краш на ×" + crashAt, "Автовывод ×2 успел сработать.", 2) : lose("Краш на ×" + crashAt, "Множитель упал до автовывода.");
    }
    case "SLOTS": {
      const symbols = ["🍒", "🔔", "💎", "7️⃣", "🍋"];
      const reels = [symbols[random(symbols.length)], symbols[random(symbols.length)], symbols[random(symbols.length)]];
      const same = reels[0] === reels[1] && reels[1] === reels[2];
      const pair = reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2];
      return same ? win(reels.join(" "), "Три одинаковых символа!", 5) : pair ? win(reels.join(" "), "Два символа совпали.", 1.5) : lose(reels.join(" "), "Комбинация не принесла выплату.");
    }
  }
  throw new Error("Unsupported game mode");
}

export default function App() {
  const [active, setActive] = useState<GameMode>("DICE");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [stake, setStake] = useState("100");
  const [balance, setBalance] = useState(10000);
  const [coinSide, setCoinSide] = useState<"Орёл" | "Решка">("Орёл");
  const [result, setResult] = useState<RoundResult | null>(null);
  const [rounds, setRounds] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const inFlight = useRef(false);
  const pendingRound = useRef<{ signature: string; key: string } | null>(null);
  const apiBase = import.meta.env.VITE_API_URL?.endsWith("/") ? import.meta.env.VITE_API_URL.slice(0, -1) : import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!apiBase) {
      setApiStatus("offline");
      return;
    }
    let cancelled = false;
    async function connect() {
      try {
        const health = await fetch(apiBase + "/health");
        if (!health.ok) throw new Error("API unavailable");
        const healthData = await health.json() as { status: string };
        if (healthData.status !== "ok") throw new Error("API unavailable");
        let savedToken = sessionStorage.getItem("bc_platform_token");
        if (savedToken) {
          const me = await fetch(apiBase + "/api/v1/me", { headers: { Authorization: "Bearer " + savedToken } });
          if (!me.ok) savedToken = null;
          else {
            const data = await me.json() as { player: { balance: number } };
            if (!cancelled) setBalance(data.player.balance);
          }
        }
        if (!savedToken) {
          const guest = await fetch(apiBase + "/api/v1/guest", { method: "POST" });
          if (!guest.ok) throw new Error("Не удалось создать гостевой аккаунт.");
          const data = await guest.json() as { token: string; player: { balance: number } };
          savedToken = data.token;
          sessionStorage.setItem("bc_platform_token", savedToken);
          if (!cancelled) setBalance(data.player.balance);
        }
        if (!cancelled) {
          setToken(savedToken);
          setApiStatus("online");
          setApiError(null);
        }
      } catch {
        if (!cancelled) {
          setApiStatus("offline");
          setApiError("Сервер недоступен. Серверные раунды временно отключены.");
        }
      }
    }
    void connect();
    return () => { cancelled = true; };
  }, [apiBase]);

  const selectedGame = games.find((game) => game.mode === active)!;
  const numericStake = Number(stake);
  const canPlay = Number.isSafeInteger(numericStake) && numericStake >= 1 && numericStake <= 1000000 && numericStake <= balance && (!apiBase || (apiStatus === "online" && Boolean(token)));

  async function playRound() {
    if (!canPlay || inFlight.current) return;
    inFlight.current = true;
    setIsPlaying(true);
    setApiError(null);
    try {
      if (apiBase) {
        if (!token) {
          setApiError("Гостевой аккаунт ещё подключается. Попробуй через секунду.");
          return;
        }
        const signature = JSON.stringify({ mode: active, stake: numericStake, coinSide });
        if (!pendingRound.current || pendingRound.current.signature !== signature) {
          pendingRound.current = { signature, key: crypto.randomUUID() };
        }
        try {
          const response = await fetch(apiBase + "/api/v1/rounds", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
              "Idempotency-Key": pendingRound.current.key,
            },
            body: signature,
          });
          const data = await response.json() as {
            error?: string;
            message?: string;
            balance?: number;
            round?: { payout: number; outcome?: { headline: string; detail: string } };
          };
          if (!response.ok) {
            if (response.status < 500) pendingRound.current = null;
            throw new Error(data.error === "insufficient_balance" ? "Недостаточно виртуальных кредитов." : data.message ?? "Сервер не принял раунд.");
          }
          pendingRound.current = null;
          if (typeof data.balance === "number") setBalance(data.balance);
          const outcome = data.round?.outcome;
          setResult({
            headline: outcome?.headline ?? "Раунд уже обработан",
            detail: outcome?.detail ?? "Повторный запрос не списал ставку повторно.",
            payout: data.round?.payout ?? 0,
          });
          setRounds((current) => current + 1);
        } catch (error) {
          setApiError(error instanceof Error ? error.message : "Не удалось сыграть раунд.");
        }
        return;
      }
      const next = playDemoRound(active, numericStake, coinSide);
      setBalance((current) => current - numericStake + next.payout);
      setResult(next);
      setRounds((current) => current + 1);
    } finally {
      inFlight.current = false;
      setIsPlaying(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="BLACK CITY — главная"><span className="brand-mark">BC</span><span className="brand-name">BLACK<span>CITY</span></span></a>
        <nav className="main-nav" aria-label="Основная навигация"><a className="nav-active" href="#games">Игры</a><a href="#about">О платформе</a></nav>
        <div className="top-actions"><span className={"status-dot status-" + apiStatus} title={apiStatus === "online" ? "API доступно" : apiStatus === "checking" ? "Проверяем API" : "API недоступно"} /><button className="login-button" type="button" onClick={() => window.alert(apiBase && token ? "Ты играешь как гостевой аккаунт. Полная авторизация будет добавлена позже." : "Авторизация будет подключена после запуска серверной части.")}>Войти <span>↗</span></button></div>
      </header>
      <section className="hero" id="about">
        <div className="hero-copy"><p className="eyebrow"><span /> НОВАЯ ИГРОВАЯ ТЕРРИТОРИЯ</p><h1>ГОРОД НЕ<br />СПИТ<span>.</span></h1><p className="hero-description">Твой следующий ход начинается здесь. Исследуй игровые режимы, соревнуйся и поднимайся в рейтинге.</p><div className="hero-actions"><a className="primary-button" href="#games">Выбрать игру <span>→</span></a><span className="currency-note"><span className="coin">◆</span> Только виртуальные кредиты</span></div></div>
        <div className="hero-art" aria-label="Абстрактный ночной городской пейзаж"><div className="moon" /><div className="skyline skyline-back"><i /><i /><i /><i /><i /><i /></div><div className="skyline skyline-front"><i /><i /><i /><i /><i /><i /><i /></div><div className="street-light" /><div className="road-glow" /><div className="hero-art-label"><span>01 / BLACK CITY</span><span>PLAY YOUR CITY</span></div></div>
        <div className="hero-index"><span>01</span><i /> 03</div>
      </section>
      <section className="games-section" id="games">
        <div className="section-heading"><div><p className="eyebrow">ВЫБИРАЙ СВОЙ РЕЖИМ</p><h2>ИГРОВАЯ <span>СЕТКА</span></h2></div><p>12 режимов.<br />Один город.</p></div>
        <div className="demo-wallet"><div><span>ДЕМО-БАЛАНС</span><strong>{balance.toLocaleString("ru-RU")} <small>кредитов</small></strong></div><div><span>СЫГРАНО РАУНДОВ</span><strong>{rounds}</strong></div><p>{apiBase ? "Серверный режим: баланс и история раундов хранятся на сервере." : "Демо-режим: баланс хранится только до перезагрузки страницы. Для серверной игры подключается VPS."}</p></div>
        <div className="game-grid">{games.map((game, index) => <button key={game.mode} className={"game-card " + (active === game.mode ? "game-card-active" : "")} onClick={() => { setActive(game.mode); setResult(null); }} type="button" aria-pressed={active === game.mode}><span className="game-number">{String(index + 1).padStart(2, "0")}</span><span className="game-symbol">{game.symbol}</span><span className="game-title">{game.title}</span><span className="game-subtitle">{game.subtitle}</span><span className="game-arrow">↗</span></button>)}</div>
        <section className="game-panel" aria-live="polite">
          <div className="game-panel-heading"><div><p className="eyebrow">ДЕМО-РАУНД</p><h3>{selectedGame.symbol} {selectedGame.title}</h3><p>{selectedGame.subtitle}</p></div><span className="demo-label">{apiBase ? "ВИРТУАЛЬНЫЕ КРЕДИТЫ · API" : "ЛОКАЛЬНОЕ ДЕМО"}</span></div>
          {active === "COINFLIP" && <div className="coin-choice"><span>Выбери сторону</span>{(["Орёл", "Решка"] as const).map((side) => <button key={side} type="button" className={coinSide === side ? "choice-active" : ""} onClick={() => { setCoinSide(side); setResult(null); }}>{side}</button>)}</div>}
          <div className="game-controls"><label htmlFor="stake">Ставка</label><input id="stake" type="number" min="1" max="1000000" step="1" value={stake} onChange={(event) => { setStake(event.target.value); setResult(null); }} /><div className="quick-stakes">{[100, 500, 1000].map((value) => <button key={value} type="button" onClick={() => { setStake(String(value)); setResult(null); }}>{value.toLocaleString("ru-RU")}</button>)}</div><button className="play-button" type="button" onClick={playRound} disabled={!canPlay || isPlaying}>{isPlaying ? "ОБРАБОТКА…" : "ИГРАТЬ"} <span>→</span></button></div>
          {!canPlay && <p className="validation-note">{numericStake > balance ? "Недостаточно виртуальных кредитов." : apiBase && apiStatus !== "online" ? "Ожидание подключения к игровому серверу." : "Введи целую ставку от 1 до 1 000 000."}</p>}
          {apiError && <p className="validation-note">{apiError}</p>}
          {result && <div className={"round-result " + (result.payout > numericStake ? "result-win" : "result-loss")}><strong>{result.headline}</strong><span>{result.detail}</span><div><span>Выплата</span><b>{result.payout.toLocaleString("ru-RU")} кредитов</b><span>Изменение баланса: {result.payout - numericStake > 0 ? "+" : ""}{(result.payout - numericStake).toLocaleString("ru-RU")}</span></div></div>}
        </section>
      </section>
      <footer className="footer"><a className="brand brand-small" href="#"><span className="brand-mark">BC</span><span className="brand-name">BLACK<span>CITY</span></span></a><span>Виртуальная игровая платформа · 2026</span><span className="footer-safe">NO REAL-MONEY PLAY</span></footer>
    </main>
  );
}

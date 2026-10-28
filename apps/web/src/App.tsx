import { useEffect, useState } from "react";
import type { GameMode } from "@black-city/shared";

const games: { mode: GameMode; title: string; subtitle: string; symbol: string; tag?: string }[] = [
  { mode: "CRASH", title: "CRASH", subtitle: "Успей забрать выигрыш", symbol: "↗", tag: "SOON" },
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

export default function App() {
  const [active, setActive] = useState<GameMode>("DICE");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000";
    fetch(`${base}/health`)
      .then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json() as Promise<{ status: string }>;
      })
      .then((result) => setApiStatus(result.status === "ok" ? "online" : "offline"))
      .catch(() => setApiStatus("offline"));
  }, []);

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="BLACK CITY — главная">
          <span className="brand-mark">BC</span>
          <span className="brand-name">BLACK<span>CITY</span></span>
        </a>
        <nav className="main-nav" aria-label="Основная навигация">
          <a className="nav-active" href="#games">Игры</a>
          <a href="#about">О платформе</a>
        </nav>
        <div className="top-actions">
          <span className={`status-dot status-${apiStatus}`} title={apiStatus === "online" ? "API доступно" : apiStatus === "checking" ? "Проверяем API" : "API недоступно"} />
          <button className="login-button" type="button" onClick={() => window.alert("Авторизация будет подключена на следующем этапе.")}>Войти <span>↗</span></button>
        </div>
      </header>

      <section className="hero" id="about">
        <div className="hero-copy">
          <p className="eyebrow"><span /> НОВАЯ ИГРОВАЯ ТЕРРИТОРИЯ</p>
          <h1>ГОРОД НЕ<br />СПИТ<span>.</span></h1>
          <p className="hero-description">Твой следующий ход начинается здесь. Исследуй игровые режимы, соревнуйся и поднимайся в рейтинге.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#games">Выбрать игру <span>→</span></a>
            <span className="currency-note"><span className="coin">◆</span> Только виртуальные кредиты</span>
          </div>
        </div>
        <div className="hero-art" aria-label="Абстрактный ночной городской пейзаж">
          <div className="moon" />
          <div className="skyline skyline-back"><i /><i /><i /><i /><i /><i /></div>
          <div className="skyline skyline-front"><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="street-light" />
          <div className="road-glow" />
          <div className="hero-art-label"><span>01 / BLACK CITY</span><span>PLAY YOUR CITY</span></div>
        </div>
        <div className="hero-index"><span>01</span><i /> 03</div>
      </section>

      <section className="games-section" id="games">
        <div className="section-heading">
          <div><p className="eyebrow">ВЫБИРАЙ СВОЙ РЕЖИМ</p><h2>ИГРОВАЯ <span>СЕТКА</span></h2></div>
          <p>12 режимов.<br />Один город.</p>
        </div>
        <div className="game-grid">
          {games.map((game, index) => (
            <button
              key={game.mode}
              className={`game-card ${active === game.mode ? "game-card-active" : ""}`}
              onClick={() => setActive(game.mode)}
              type="button"
              aria-pressed={active === game.mode}
            >
              <span className="game-number">0{index + 1}</span>
              {game.tag && <span className="game-tag">{game.tag}</span>}
              <span className="game-symbol">{game.symbol}</span>
              <span className="game-title">{game.title}</span>
              <span className="game-subtitle">{game.subtitle}</span>
              <span className="game-arrow">↗</span>
            </button>
          ))}
        </div>
        <div className="selected-game">
          <span className="selected-indicator" />
          <span>ВЫБРАН РЕЖИМ</span>
          <strong>{games.find((game) => game.mode === active)?.title}</strong>
          <span className="selected-hint">Игровая логика подключается поэтапно</span>
        </div>
      </section>

      <footer className="footer">
        <a className="brand brand-small" href="#"><span className="brand-mark">BC</span><span className="brand-name">BLACK<span>CITY</span></span></a>
        <span>Виртуальная игровая платформа · 2026</span>
        <span className="footer-safe">NO REAL-MONEY PLAY</span>
      </footer>
    </main>
  );
}

import Fastify from "fastify";

const app = Fastify({ logger: true });
const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? "127.0.0.1";

app.get("/health", async () => ({
  status: "ok",
  service: "black-city-api",
  version: "0.1.0",
}));

app.get("/api/v1/games", async () => ({
  modes: [
    "LUCKY", "COINFLIP", "DICE", "PLINKO", "WHEEL", "CRASH",
    "MINES", "TOWER", "WHEEL_MINI", "WHEEL_MEGA", "CRAZY TIME", "SLOTS",
  ],
  currency: "virtual-credits",
  realMoneyEnabled: false,
}));

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}

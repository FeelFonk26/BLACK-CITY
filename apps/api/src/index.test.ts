import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Fastify from "fastify";

describe("API health route", () => {
  const app = Fastify();

  beforeAll(async () => {
    app.get("/health", async () => ({
      status: "ok",
      service: "black-city-api",
      version: "0.1.0",
    }));
    await app.ready();
  });

  afterAll(async () => app.close());

  it("returns health status without secrets", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
      service: "black-city-api",
      version: "0.1.0",
    });
  });
});

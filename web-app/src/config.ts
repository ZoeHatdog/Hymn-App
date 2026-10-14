export const config = {
  port: Number(process.env.WEB_PORT ?? 3001),
  host: process.env.WEB_HOST ?? "0.0.0.0",
  apiBaseUrl: (process.env.API_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
};

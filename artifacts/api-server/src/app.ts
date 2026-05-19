import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Resolve allowed origins from environment, defaulting to localhost dev
const getAllowedOrigins = (): string[] => {
  const env = process.env["ALLOWED_ORIGINS"];
  if (env) return env.split(",").map((o) => o.trim());
  // Development fallback — restrict to common dev ports
  return ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"];
};

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;

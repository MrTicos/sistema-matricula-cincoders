import session from "express-session";
import { SQLite3Store } from "@bleed-believer/connect-sqlite3";
import { resolve } from "node:path";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET deve conter pelo menos 32 caracteres."
  );
}

// Separa as sessões dos testes das sessões de desenvolvimento.
const sessionDatabase =
  process.env.NODE_ENV === "test"
    ? "sessions.test.db"
    : "sessions.db";

const store = new SQLite3Store(
  resolve(process.cwd(), sessionDatabase)
);

export const sessionMiddleware = session({
  name: "cincoders.sid",

  secret: sessionSecret,

  store,

  resave: false,

  saveUninitialized: false,

  cookie: {
    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax",

    maxAge: 1000 * 60 * 60 * 8,
  },
});
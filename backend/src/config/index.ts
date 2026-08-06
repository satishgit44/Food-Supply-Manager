import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  mysql: {
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "1234",
    database: process.env.MYSQL_DATABASE || "food_supply",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  },

  cookie: {
    secure: (process.env.COOKIE_SECURE || "false").toLowerCase() === "true",
    sameSite: (process.env.COOKIE_SAMESITE || "lax") as "lax" | "strict" | "none",
  },

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  allowRegistration: (process.env.ALLOW_REGISTRATION || "true").toLowerCase() === "true",
};

export const WRITE_ROLES = new Set(["admin", "manager"]);
export const ADMIN_ROLES = new Set(["admin"]);

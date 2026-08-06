import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { pool } from "./db";

import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import categoriesRoutes from "./routes/categories.routes";
import suppliersRoutes from "./routes/suppliers.routes";
import productsRoutes from "./routes/products.routes";
import warehousesRoutes from "./routes/warehouses.routes";
import inventoryRoutes from "./routes/inventory.routes";
import distributorsRoutes from "./routes/distributors.routes";
import customersRoutes from "./routes/customers.routes";
import ordersRoutes from "./routes/orders.routes";
import paymentsRoutes from "./routes/payments.routes";
import reportsRoutes from "./routes/reports.routes";
import usersRoutes from "./routes/users.routes";
import { notFound, errorHandler } from "./middleware/error";

const app: Express = express();

// ---------- Global middleware ----------
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Simple request logger in dev
if (config.nodeEnv !== "production") {
  app.use((req, _res, next) => {
    // eslint-disable-next-line no-console
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ---------- API routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/warehouses", warehousesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/distributors", distributorsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/users", usersRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---------- Error handling ----------
app.use(notFound);
app.use(errorHandler);

async function start(): Promise<void> {
  try {
    // Verify DB connectivity before listening.
    await pool.query("SELECT 1");
    // eslint-disable-next-line no-console
    console.log("[OK] Connected to MySQL database.");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[ERROR] Database connection failed:", (e as Error).message);
  }
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[OK] API server running on http://localhost:${config.port}`);
  });
}

start();

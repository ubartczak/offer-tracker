import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { applicationsRouter } from "./routes/applications";
import { authenticate } from "./middleware/authenticate";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Public routes
app.use("/auth", authRouter);

// Protected routes
app.use("/applications", authenticate, applicationsRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

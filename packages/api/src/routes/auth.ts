import { Router, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";

export const authRouter = Router();

const isProd = process.env.NODE_ENV === "production";

const COOKIE_BASE = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  path: "/",
};

function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearTokenCookies(res: Response) {
  res.clearCookie("accessToken", COOKIE_BASE);
  res.clearCookie("refreshToken", COOKIE_BASE);
}

const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy email"),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /auth/register
authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email już zajęty" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setTokenCookies(res, accessToken, refreshToken);
    // tokens also in body for non-browser clients (extension)
    res.status(201).json({ user, accessToken, refreshToken });
  } catch {
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// POST /auth/login
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Nieprawidłowe dane" });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
      return;
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setTokenCookies(res, accessToken, refreshToken);
    // tokens also in body for non-browser clients (extension)
    res.json({
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    });
  } catch {
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// POST /auth/refresh — accepts cookie or body (extension uses body)
authRouter.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;

  if (!refreshToken) {
    res.status(400).json({ error: "Brak refresh tokenu" });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      clearTokenCookies(res);
      res.status(401).json({ error: "Refresh token nieważny" });
      return;
    }

    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const newPayload = { userId: payload.userId, email: payload.email };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: payload.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setTokenCookies(res, newAccessToken, newRefreshToken);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    clearTokenCookies(res);
    res.status(401).json({ error: "Refresh token nieważny" });
  }
});

// POST /auth/logout — accepts cookie or body (extension uses body)
authRouter.post("/logout", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  clearTokenCookies(res);
  res.json({ ok: true });
});

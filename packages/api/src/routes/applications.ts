import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/authenticate";
import { ApplicationStatus, Portal } from "@prisma/client";

const salaryTypeEnum = z.enum(["HOURLY", "WEEKLY", "MONTHLY", "YEARLY", "OTHER"]);

export const applicationsRouter = Router();

const createSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  url: z.string().url("Nieprawidłowy URL"),
  portal: z.nativeEnum(Portal).default("OTHER"),
  status: z.nativeEnum(ApplicationStatus).default("APPLIED"),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  currency: z.enum(["PLN", "USD", "EUR", "OTHER"]).optional(),
  salaryType: salaryTypeEnum.default("MONTHLY"),
  interviewAt: z.string().datetime().optional(),
  replyBy: z.string().datetime().optional(),
  offerExpiresAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  feedback: z.string().optional(),
  contractType: z.string().max(50).optional(),
  tags: z.array(z.string()).default([]),
  appliedAt: z.string().datetime().optional(),
});

const updateSchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  currency: z.enum(["PLN", "USD", "EUR", "OTHER"]).optional(),
  salaryType: salaryTypeEnum.optional(),
  interviewAt: z.string().datetime().optional(),
  replyBy: z.string().datetime().optional(),
  offerExpiresAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  feedback: z.string().optional(),
  contractType: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
});

const listQuerySchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
  portal: z.nativeEnum(Portal).optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20),
});

// GET /applications/stats  — must be before /:id to avoid route shadowing
applicationsRouter.get("/stats", async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const statsWhere = { userId, status: { not: "SAVED" as ApplicationStatus } };

  const [total, byStatus, byPortal] = await Promise.all([
    prisma.jobApplication.count({ where: statsWhere }),
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: statsWhere,
      _count: true,
    }),
    prisma.jobApplication.groupBy({
      by: ["portal"],
      where: statsWhere,
      _count: true,
    }),
  ]);

  const responseRate =
    total > 0
      ? Math.round(
          (byStatus
            .filter((s) => s.status !== "APPLIED" && s.status !== "IGNORED")
            .reduce((sum, s) => sum + s._count, 0) /
            total) *
            100
        )
      : 0;

  res.json({
    total,
    responseRate,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    byPortal: Object.fromEntries(byPortal.map((p) => [p.portal, p._count])),
  });
});

// GET /applications
applicationsRouter.get("/", async (req: AuthRequest, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Nieprawidłowe parametry" });
    return;
  }

  const { status, portal, search, page, limit } = parsed.data;
  const userId = req.user!.userId;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(status ? { status } : { status: { not: "SAVED" as ApplicationStatus } }),
    ...(portal && { portal }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { company: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.jobApplication.count({ where }),
  ]);

  res.json({
    applications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// POST /applications
applicationsRouter.post("/", async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { appliedAt, interviewAt, replyBy, offerExpiresAt, ...rest } = parsed.data;
  const application = await prisma.jobApplication.create({
    data: {
      ...rest,
      userId: req.user!.userId,
      appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
      ...(interviewAt && { interviewAt: new Date(interviewAt) }),
      ...(replyBy && { replyBy: new Date(replyBy) }),
      ...(offerExpiresAt && { offerExpiresAt: new Date(offerExpiresAt) }),
    },
  });

  res.status(201).json(application);
});

// PATCH /applications/:id
applicationsRouter.patch("/:id", async (req: AuthRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const existing = await prisma.jobApplication.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!existing) {
    res.status(404).json({ error: "Nie znaleziono aplikacji" });
    return;
  }

  const { interviewAt, replyBy, offerExpiresAt, ...rest } = parsed.data;
  const updated = await prisma.jobApplication.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(interviewAt !== undefined && { interviewAt: new Date(interviewAt) }),
      ...(replyBy !== undefined && { replyBy: new Date(replyBy) }),
      ...(offerExpiresAt !== undefined && { offerExpiresAt: new Date(offerExpiresAt) }),
    },
  });

  res.json(updated);
});

// DELETE /applications/:id
applicationsRouter.delete("/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.jobApplication.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!existing) {
    res.status(404).json({ error: "Nie znaleziono aplikacji" });
    return;
  }

  await prisma.jobApplication.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});


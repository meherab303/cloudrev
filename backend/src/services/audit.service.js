import prisma from '../config/prisma.js';

export async function logAction({ userId, action, resource, req, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        resource: resource || null,
        ip: req?.ip || req?.headers?.['x-forwarded-for'] || null,
        userAgent: req?.headers?.['user-agent'] || null,
        metadata: metadata || undefined,
      },
    });
  } catch (err) {
    console.error('audit log failed:', err.message);
  }
}

export async function listAuditLogs({ page, limit, skip, userId, action }) {
  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { id: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { rows, total };
}

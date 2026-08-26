import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';
import { env } from '../src/config/env.js';

export async function seedAdmin() {
  const email = env.adminEmail.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(env.adminPassword, env.bcryptRounds);
  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
      storageQuota: BigInt(env.defaultQuota),
    },
  });
  console.log(`Seeded admin: ${email}`);
  return admin;
}

const isMain = process.argv[1]?.includes('seed.js');
if (isMain) {
  seedAdmin()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

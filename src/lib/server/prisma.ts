import { PrismaClient } from '@prisma-app/client';

const db = new PrismaClient();

export { db };
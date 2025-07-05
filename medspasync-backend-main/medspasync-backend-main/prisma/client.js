const { PrismaClient } = require('@prisma/client');

// Singleton Prisma client for use across the application
const prisma = new PrismaClient();

async function disconnect() {
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error('Prisma disconnect error:', err);
  }
}

module.exports = { prisma, disconnect };


const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting sandbox seeding...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Sandbox Tenant',
      domain: 'sandbox.medspasync.pro',
      subscriptionTier: 'PROFESSIONAL',
      clientLimit: 1000,
      userLimit: 25,
      locationLimit: 5,
      apiCallLimit: 10000,
      subscriptionStatus: 'TRIAL',
      trialEndDate: new Date(new Date().setDate(new Date().getDate() + 30))
    },
  });

  // 2. Create User
  const user = await prisma.user.create({
    data: {
      email: 'sandbox@medspasync.pro',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  // 3. Create Practice
  const practice = await prisma.practice.create({
    data: {
      name: 'Sandbox Medical Spa',
      users: {
        connect: { id: user.id },
      },
    },
  });

  // 4. Create Staff
  const staff = await prisma.staff.create({
      data: {
          userId: user.id,
          practiceId: practice.id,
          firstName: 'Dr. Sandbox',
          lastName: 'User',
          role: 'PRACTITIONER',
          specializations: ['Botox', 'Fillers'],
      }
  })

  // 5. Create Services
  const services = await prisma.service.createMany({
    data: [
      { name: 'Botox', category: 'Injectables', duration: 30, price: 500 },
      { name: 'Lip Filler', category: 'Injectables', duration: 45, price: 750 },
      { name: 'Chemical Peel', category: 'Skincare', duration: 60, price: 250 },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// ==============================
// 🌱 seed.js
// ==============================
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const practiceId = 'demo-practice';

  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Facial Treatment',
        category: 'Skincare',
        description: 'Deep cleansing facial',
        duration: 60,
        price: 150.00
      }
    }),
    prisma.service.create({
      data: {
        name: 'Botox Treatment',
        category: 'Cosmetic',
        description: 'Anti-aging injections',
        duration: 30,
        price: 300.00
      }
    }),
    prisma.service.create({
      data: {
        name: 'Massage Therapy',
        category: 'Wellness',
        description: 'Relaxing massage',
        duration: 90,
        price: 200.00
      }
    })
  ]);

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '(555) 123-4567',
        status: 'VIP',
        notes: 'Regular client'
      }
    }),
    prisma.client.create({
      data: {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@email.com',
        phone: '(555) 987-6543',
        status: 'ACTIVE',
        notes: 'New client'
      }
    })
  ]);

  const demoUser = await prisma.user.create({
    data: {
      email: 'dr.smith@medspasync.com',
      password: 'hashed_password',
      practiceId,
      role: 'ADMIN'
    }
  });

  const staff = await prisma.staff.create({
    data: {
      userId: demoUser.id,
      practiceId,
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      role: 'PRACTITIONER',
      specializations: ['Botox', 'Facials'],
      phone: '(555) 111-2222',
      email: 'dr.smith@medspasync.com',
      workingHours: {
        monday: { start: '09:00', end: '17:00' }
      },
      hourlyRate: 75.00
    }
  });

  const appointments = await prisma.appointment.create({
    data: {
      practiceId,
      clientId: clients[0].id,
      serviceId: services[0].id,
      staffId: staff.id,
      dateTime: new Date('2025-06-08T10:00:00'),
      duration: services[0].duration,
      price: services[0].price,
      status: 'CONFIRMED',
      notes: 'Consultation'
    }
  });

  console.log('✅ Database seeded!');
  console.log(`📊 ${services.length} services`);
  console.log(`👥 ${clients.length} clients`);
  console.log(`📅 1 appointment`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

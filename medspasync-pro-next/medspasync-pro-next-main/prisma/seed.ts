import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample leads
  const sampleLeads = [
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@beautyspa.com',
      phone: '+1-555-0123',
      practiceName: 'Beauty & Wellness Spa',
      practiceType: 'SINGLE_LOCATION',
      currentReconciliationTime: 'TEN_TO_FIFTEEN',
      rewardsPrograms: ['Sephora Beauty Insider', 'Ulta Rewards'],
      monthlyTransactions: 'ONE_THOUSAND_TO_TWO_THOUSAND',
      painPoints: 'We spend 12 hours weekly manually reconciling rewards programs. The process is error-prone and time-consuming, especially during peak seasons.',
      timeline: 'WITHIN_30_DAYS',
      source: 'GOOGLE',
      status: 'NEW',
    },
    {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@medspa.com',
      phone: '+1-555-0456',
      practiceName: 'Advanced Medical Spa',
      practiceType: 'MULTI_LOCATION',
      currentReconciliationTime: 'FIFTEEN_PLUS',
      rewardsPrograms: ['Aspire Rewards', 'Allē', 'Aspire Gifts'],
      monthlyTransactions: 'TWO_THOUSAND_PLUS',
      painPoints: 'Managing rewards across 3 locations is a nightmare. We have inconsistent processes and often miss reconciliation deadlines.',
      timeline: 'IMMEDIATELY',
      source: 'REFERRAL',
      status: 'CONTACTED',
    },
    {
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@skincare.com',
      phone: '+1-555-0789',
      practiceName: 'Glow Skincare Clinic',
      practiceType: 'SINGLE_LOCATION',
      currentReconciliationTime: 'FIVE_TO_TEN',
      rewardsPrograms: ['SkinStore Rewards', 'Dermstore Rewards'],
      monthlyTransactions: 'FIVE_HUNDRED_TO_ONE_THOUSAND',
      painPoints: 'Our current system is outdated and doesn\'t integrate well with our POS. We need a more streamlined approach.',
      timeline: 'WITHIN_90_DAYS',
      source: 'SOCIAL_MEDIA',
      status: 'QUALIFIED',
    },
  ];

  for (const leadData of sampleLeads) {
    try {
      const existingLead = await prisma.lead.findUnique({
        where: { email: leadData.email }
      });

      if (!existingLead) {
        await prisma.lead.create({
          data: leadData
        });
        console.log(`✅ Created lead: ${leadData.firstName} ${leadData.lastName}`);
      } else {
        console.log(`⏭️  Lead already exists: ${leadData.firstName} ${leadData.lastName}`);
      }
    } catch (error) {
      console.error(`❌ Error creating lead ${leadData.firstName} ${leadData.lastName}:`, error);
    }
  }

  // Create sample users
  const sampleUsers = [
    {
      email: 'admin@medspasyncpro.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
    {
      email: 'demo@medspasyncpro.com',
      name: 'Demo User',
      role: 'USER',
    },
  ];

  for (const userData of sampleUsers) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: userData
        });
        console.log(`✅ Created user: ${userData.name}`);
      } else {
        console.log(`⏭️  User already exists: ${userData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.name}:`, error);
    }
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
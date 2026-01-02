import { PrismaClient } from '@prisma/client';
import {
  seedAdmin,
  seedDepartments,
  seedMedicineCategories,
  seedSpecialties,
  seedMedicines,
  seedDoctors,
} from './seeds';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  await seedAdmin(prisma);
  await seedDepartments(prisma);
  await seedMedicineCategories(prisma);
  await seedSpecialties(prisma);
  await seedMedicines(prisma);
  await seedDoctors(prisma);

  console.log('\n✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


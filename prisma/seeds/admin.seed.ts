import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const adminUser = {
  email: 'admin@hospital.com',
  password: 'Admin@123',
  fullName: 'System Administrator',
  phone: '0901234567',
  role: 'ADMIN' as const,
  isActive: true,
};

export async function seedAdmin(prisma: PrismaClient) {
  console.log('👤 Seeding admin account...');

  const hashedPassword = await bcrypt.hash(adminUser.password, SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: adminUser.email },
    update: {},
    create: {
      email: adminUser.email,
      password: hashedPassword,
      fullName: adminUser.fullName,
      phone: adminUser.phone,
      role: adminUser.role,
      isActive: adminUser.isActive,
    },
  });

  console.log(`✅ Seeded admin account: ${adminUser.email}`);
  console.log(`   Password: ${adminUser.password}`);
}

export { adminUser };


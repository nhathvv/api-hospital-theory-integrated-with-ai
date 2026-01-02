import { PrismaClient } from '@prisma/client';

const departments = [
  {
    code: 'NOI',
    name: 'Khoa Nội',
    description: 'Khoa Nội tổng hợp - chẩn đoán và điều trị các bệnh lý nội khoa',
  },
  {
    code: 'NGOAI',
    name: 'Khoa Ngoại',
    description: 'Khoa Ngoại tổng hợp - phẫu thuật và điều trị các bệnh ngoại khoa',
  },
  {
    code: 'NHI',
    name: 'Khoa Nhi',
    description: 'Chăm sóc và điều trị bệnh cho trẻ em từ 0-16 tuổi',
  },
  {
    code: 'SAN',
    name: 'Khoa Sản',
    description: 'Chăm sóc sức khỏe sinh sản và thai sản',
  },
  {
    code: 'TMH',
    name: 'Khoa Tai Mũi Họng',
    description: 'Chẩn đoán và điều trị các bệnh về tai, mũi, họng',
  },
  {
    code: 'MAT',
    name: 'Khoa Mắt',
    description: 'Khám và điều trị các bệnh về mắt',
  },
  {
    code: 'DA_LIEU',
    name: 'Khoa Da Liễu',
    description: 'Điều trị các bệnh về da và thẩm mỹ da',
  },
  {
    code: 'RHM',
    name: 'Khoa Răng Hàm Mặt',
    description: 'Nha khoa và phẫu thuật hàm mặt',
  },
  {
    code: 'THAN_KINH',
    name: 'Khoa Thần Kinh',
    description: 'Chẩn đoán và điều trị các bệnh lý thần kinh',
  },
  {
    code: 'TIM_MACH',
    name: 'Khoa Tim Mạch',
    description: 'Điều trị các bệnh lý tim mạch',
  },
];

export async function seedDepartments(prisma: PrismaClient) {
  console.log('🏥 Seeding departments...');

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }

  console.log(`✅ Seeded ${departments.length} departments`);
}

export { departments };


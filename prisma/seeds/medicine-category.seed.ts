import { PrismaClient } from '@prisma/client';

const medicineCategories = [
  {
    code: 'ANTIBIOTICS',
    name: 'Kháng sinh',
    description: 'Thuốc điều trị nhiễm khuẩn',
  },
  {
    code: 'ANALGESICS',
    name: 'Giảm đau',
    description: 'Thuốc giảm đau và hạ sốt',
  },
  {
    code: 'ANTIPYRETICS',
    name: 'Hạ sốt',
    description: 'Thuốc hạ sốt',
  },
  {
    code: 'ANTIHISTAMINES',
    name: 'Kháng histamin',
    description: 'Thuốc chống dị ứng',
  },
  {
    code: 'CARDIOVASCULAR',
    name: 'Tim mạch',
    description: 'Thuốc điều trị bệnh tim mạch',
  },
  {
    code: 'GASTROINTESTINAL',
    name: 'Tiêu hóa',
    description: 'Thuốc điều trị bệnh đường tiêu hóa',
  },
  {
    code: 'RESPIRATORY',
    name: 'Hô hấp',
    description: 'Thuốc điều trị bệnh hô hấp',
  },
  {
    code: 'VITAMINS',
    name: 'Vitamin & Khoáng chất',
    description: 'Bổ sung vitamin và khoáng chất',
  },
  {
    code: 'DIABETES',
    name: 'Đái tháo đường',
    description: 'Thuốc điều trị đái tháo đường',
  },
  {
    code: 'ANTIDEPRESSANTS',
    name: 'An thần - Chống trầm cảm',
    description: 'Thuốc an thần và điều trị trầm cảm',
  },
  {
    code: 'DERMATOLOGY',
    name: 'Da liễu',
    description: 'Thuốc điều trị bệnh ngoài da',
  },
  {
    code: 'OPHTHALMOLOGY',
    name: 'Nhãn khoa',
    description: 'Thuốc nhỏ mắt và điều trị mắt',
  },
];

export async function seedMedicineCategories(prisma: PrismaClient) {
  console.log('💊 Seeding medicine categories...');

  for (const category of medicineCategories) {
    await prisma.medicineCategory.upsert({
      where: { code: category.code },
      update: {},
      create: category,
    });
  }

  console.log(`✅ Seeded ${medicineCategories.length} medicine categories`);
}

export { medicineCategories };


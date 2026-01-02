import { PrismaClient } from '@prisma/client';

const specialtiesByDepartment: Record<string, { name: string; description: string }[]> = {
  NOI: [
    { name: 'Nội Tim mạch', description: 'Chẩn đoán và điều trị các bệnh lý tim mạch nội khoa' },
    { name: 'Nội Tiêu hóa', description: 'Điều trị các bệnh về dạ dày, ruột, gan, mật' },
    { name: 'Nội Hô hấp', description: 'Điều trị các bệnh về phổi và đường hô hấp' },
    { name: 'Nội Thận - Tiết niệu', description: 'Điều trị các bệnh về thận và đường tiết niệu' },
    { name: 'Nội Tiết', description: 'Điều trị các bệnh về nội tiết và chuyển hóa' },
    { name: 'Huyết học', description: 'Chẩn đoán và điều trị các bệnh về máu' },
  ],
  NGOAI: [
    { name: 'Ngoại Tổng hợp', description: 'Phẫu thuật tổng quát' },
    { name: 'Ngoại Tiêu hóa', description: 'Phẫu thuật các bệnh đường tiêu hóa' },
    { name: 'Chấn thương - Chỉnh hình', description: 'Điều trị chấn thương và bệnh lý cơ xương khớp' },
    { name: 'Ngoại Tiết niệu', description: 'Phẫu thuật các bệnh đường tiết niệu' },
  ],
  NHI: [
    { name: 'Nhi Tổng quát', description: 'Khám và điều trị bệnh tổng quát cho trẻ em' },
    { name: 'Nhi Sơ sinh', description: 'Chăm sóc và điều trị trẻ sơ sinh' },
  ],
  SAN: [
    { name: 'Sản khoa', description: 'Theo dõi thai kỳ và đỡ đẻ' },
    { name: 'Phụ khoa', description: 'Điều trị các bệnh phụ khoa' },
  ],
  TMH: [
    { name: 'Tai Mũi Họng Người lớn', description: 'Điều trị bệnh TMH cho người lớn' },
    { name: 'Tai Mũi Họng Nhi', description: 'Điều trị bệnh TMH cho trẻ em' },
  ],
  MAT: [
    { name: 'Nhãn khoa Tổng quát', description: 'Khám và điều trị các bệnh về mắt' },
    { name: 'Phẫu thuật Khúc xạ', description: 'Phẫu thuật điều trị tật khúc xạ' },
  ],
  DA_LIEU: [
    { name: 'Da liễu Tổng quát', description: 'Điều trị các bệnh da liễu thông thường' },
    { name: 'Thẩm mỹ Da', description: 'Điều trị thẩm mỹ và làm đẹp da' },
  ],
  THAN_KINH: [
    { name: 'Thần kinh Tổng quát', description: 'Chẩn đoán và điều trị các bệnh thần kinh' },
  ],
  TIM_MACH: [
    { name: 'Tim mạch Can thiệp', description: 'Can thiệp và điều trị bệnh tim mạch' },
  ],
};

export async function seedSpecialties(prisma: PrismaClient) {
  console.log('🩺 Seeding specialties...');

  const departments = await prisma.department.findMany();
  const departmentMap = new Map(departments.map((d) => [d.code, d.id]));

  let count = 0;
  for (const [deptCode, specialties] of Object.entries(specialtiesByDepartment)) {
    const departmentId = departmentMap.get(deptCode);

    for (const specialty of specialties) {
      await prisma.specialty.upsert({
        where: { name: specialty.name },
        update: {},
        create: {
          name: specialty.name,
          description: specialty.description,
          departmentId,
        },
      });
      count++;
    }
  }

  console.log(`✅ Seeded ${count} specialties`);
}

export { specialtiesByDepartment };


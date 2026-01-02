import { MedicineUnit, PrismaClient } from '@prisma/client';

interface MedicineSeed {
  code: string;
  name: string;
  activeIngredient: string;
  description: string;
  unit: MedicineUnit;
  dosage: string;
  manufacturer: string;
  requiresPrescription: boolean;
  categoryCode: string;
}

const medicines: MedicineSeed[] = [
  // Kháng sinh (ANTIBIOTICS)
  {
    code: 'AMX500',
    name: 'Amoxicillin 500mg',
    activeIngredient: 'Amoxicillin',
    description: 'Kháng sinh nhóm Penicillin điều trị nhiễm khuẩn',
    unit: 'CAPSULE',
    dosage: '500mg',
    manufacturer: 'Domesco',
    requiresPrescription: true,
    categoryCode: 'ANTIBIOTICS',
  },
  {
    code: 'AUG1G',
    name: 'Augmentin 1g',
    activeIngredient: 'Amoxicillin + Clavulanic acid',
    description: 'Kháng sinh phổ rộng điều trị nhiễm khuẩn',
    unit: 'TABLET',
    dosage: '1g',
    manufacturer: 'GSK',
    requiresPrescription: true,
    categoryCode: 'ANTIBIOTICS',
  },
  {
    code: 'AZI250',
    name: 'Azithromycin 250mg',
    activeIngredient: 'Azithromycin',
    description: 'Kháng sinh nhóm Macrolid',
    unit: 'TABLET',
    dosage: '250mg',
    manufacturer: 'Pfizer',
    requiresPrescription: true,
    categoryCode: 'ANTIBIOTICS',
  },
  {
    code: 'CEF200',
    name: 'Cefixime 200mg',
    activeIngredient: 'Cefixime',
    description: 'Kháng sinh nhóm Cephalosporin thế hệ 3',
    unit: 'CAPSULE',
    dosage: '200mg',
    manufacturer: 'Sanofi',
    requiresPrescription: true,
    categoryCode: 'ANTIBIOTICS',
  },
  {
    code: 'CIP500',
    name: 'Ciprofloxacin 500mg',
    activeIngredient: 'Ciprofloxacin',
    description: 'Kháng sinh nhóm Quinolone',
    unit: 'TABLET',
    dosage: '500mg',
    manufacturer: 'Bayer',
    requiresPrescription: true,
    categoryCode: 'ANTIBIOTICS',
  },

  // Giảm đau (ANALGESICS)
  {
    code: 'PAR500',
    name: 'Paracetamol 500mg',
    activeIngredient: 'Paracetamol',
    description: 'Giảm đau, hạ sốt',
    unit: 'TABLET',
    dosage: '500mg',
    manufacturer: 'Nadyphar',
    requiresPrescription: false,
    categoryCode: 'ANALGESICS',
  },
  {
    code: 'IBU400',
    name: 'Ibuprofen 400mg',
    activeIngredient: 'Ibuprofen',
    description: 'Giảm đau, chống viêm không steroid',
    unit: 'TABLET',
    dosage: '400mg',
    manufacturer: 'Pharmacity',
    requiresPrescription: false,
    categoryCode: 'ANALGESICS',
  },
  {
    code: 'DIC50',
    name: 'Diclofenac 50mg',
    activeIngredient: 'Diclofenac',
    description: 'Giảm đau, chống viêm',
    unit: 'TABLET',
    dosage: '50mg',
    manufacturer: 'Novartis',
    requiresPrescription: true,
    categoryCode: 'ANALGESICS',
  },
  {
    code: 'TRA50',
    name: 'Tramadol 50mg',
    activeIngredient: 'Tramadol',
    description: 'Giảm đau mức độ vừa đến nặng',
    unit: 'CAPSULE',
    dosage: '50mg',
    manufacturer: 'Stada',
    requiresPrescription: true,
    categoryCode: 'ANALGESICS',
  },

  // Hạ sốt (ANTIPYRETICS)
  {
    code: 'EFF500',
    name: 'Efferalgan 500mg',
    activeIngredient: 'Paracetamol',
    description: 'Viên sủi hạ sốt, giảm đau',
    unit: 'TABLET',
    dosage: '500mg',
    manufacturer: 'UPSA',
    requiresPrescription: false,
    categoryCode: 'ANTIPYRETICS',
  },
  {
    code: 'HAP650',
    name: 'Hapacol 650mg',
    activeIngredient: 'Paracetamol',
    description: 'Hạ sốt, giảm đau',
    unit: 'TABLET',
    dosage: '650mg',
    manufacturer: 'DHG Pharma',
    requiresPrescription: false,
    categoryCode: 'ANTIPYRETICS',
  },

  // Kháng histamin (ANTIHISTAMINES)
  {
    code: 'CET10',
    name: 'Cetirizine 10mg',
    activeIngredient: 'Cetirizine',
    description: 'Chống dị ứng, viêm mũi dị ứng',
    unit: 'TABLET',
    dosage: '10mg',
    manufacturer: 'Sanofi',
    requiresPrescription: false,
    categoryCode: 'ANTIHISTAMINES',
  },
  {
    code: 'LOR10',
    name: 'Loratadine 10mg',
    activeIngredient: 'Loratadine',
    description: 'Chống dị ứng không gây buồn ngủ',
    unit: 'TABLET',
    dosage: '10mg',
    manufacturer: 'Domesco',
    requiresPrescription: false,
    categoryCode: 'ANTIHISTAMINES',
  },
  {
    code: 'FEX180',
    name: 'Fexofenadine 180mg',
    activeIngredient: 'Fexofenadine',
    description: 'Điều trị viêm mũi dị ứng, mày đay',
    unit: 'TABLET',
    dosage: '180mg',
    manufacturer: 'Sanofi',
    requiresPrescription: false,
    categoryCode: 'ANTIHISTAMINES',
  },

  // Tim mạch (CARDIOVASCULAR)
  {
    code: 'AML5',
    name: 'Amlodipine 5mg',
    activeIngredient: 'Amlodipine',
    description: 'Điều trị tăng huyết áp',
    unit: 'TABLET',
    dosage: '5mg',
    manufacturer: 'Pfizer',
    requiresPrescription: true,
    categoryCode: 'CARDIOVASCULAR',
  },
  {
    code: 'LOS50',
    name: 'Losartan 50mg',
    activeIngredient: 'Losartan',
    description: 'Điều trị tăng huyết áp',
    unit: 'TABLET',
    dosage: '50mg',
    manufacturer: 'Merck',
    requiresPrescription: true,
    categoryCode: 'CARDIOVASCULAR',
  },
  {
    code: 'ATO20',
    name: 'Atorvastatin 20mg',
    activeIngredient: 'Atorvastatin',
    description: 'Giảm cholesterol máu',
    unit: 'TABLET',
    dosage: '20mg',
    manufacturer: 'Pfizer',
    requiresPrescription: true,
    categoryCode: 'CARDIOVASCULAR',
  },
  {
    code: 'ASP81',
    name: 'Aspirin 81mg',
    activeIngredient: 'Acetylsalicylic acid',
    description: 'Phòng ngừa huyết khối',
    unit: 'TABLET',
    dosage: '81mg',
    manufacturer: 'Bayer',
    requiresPrescription: false,
    categoryCode: 'CARDIOVASCULAR',
  },

  // Tiêu hóa (GASTROINTESTINAL)
  {
    code: 'OME20',
    name: 'Omeprazole 20mg',
    activeIngredient: 'Omeprazole',
    description: 'Điều trị loét dạ dày, trào ngược dạ dày',
    unit: 'CAPSULE',
    dosage: '20mg',
    manufacturer: 'AstraZeneca',
    requiresPrescription: true,
    categoryCode: 'GASTROINTESTINAL',
  },
  {
    code: 'DOM10',
    name: 'Domperidone 10mg',
    activeIngredient: 'Domperidone',
    description: 'Chống nôn, tăng nhu động ruột',
    unit: 'TABLET',
    dosage: '10mg',
    manufacturer: 'Janssen',
    requiresPrescription: false,
    categoryCode: 'GASTROINTESTINAL',
  },
  {
    code: 'SME3G',
    name: 'Smecta 3g',
    activeIngredient: 'Diosmectite',
    description: 'Điều trị tiêu chảy cấp',
    unit: 'SACHET',
    dosage: '3g',
    manufacturer: 'Ipsen',
    requiresPrescription: false,
    categoryCode: 'GASTROINTESTINAL',
  },
  {
    code: 'PHO20',
    name: 'Phosphalugel 20g',
    activeIngredient: 'Aluminium phosphate',
    description: 'Trung hòa acid dạ dày',
    unit: 'SACHET',
    dosage: '20g',
    manufacturer: 'Sanofi',
    requiresPrescription: false,
    categoryCode: 'GASTROINTESTINAL',
  },

  // Hô hấp (RESPIRATORY)
  {
    code: 'SAL2',
    name: 'Salbutamol 2mg',
    activeIngredient: 'Salbutamol',
    description: 'Giãn phế quản, điều trị hen suyễn',
    unit: 'TABLET',
    dosage: '2mg',
    manufacturer: 'GSK',
    requiresPrescription: true,
    categoryCode: 'RESPIRATORY',
  },
  {
    code: 'BRO8',
    name: 'Bromhexine 8mg',
    activeIngredient: 'Bromhexine',
    description: 'Long đờm, tiêu chất nhầy',
    unit: 'TABLET',
    dosage: '8mg',
    manufacturer: 'Boehringer',
    requiresPrescription: false,
    categoryCode: 'RESPIRATORY',
  },
  {
    code: 'ACC200',
    name: 'Acetylcysteine 200mg',
    activeIngredient: 'Acetylcysteine',
    description: 'Tiêu chất nhầy đường hô hấp',
    unit: 'SACHET',
    dosage: '200mg',
    manufacturer: 'Zambon',
    requiresPrescription: false,
    categoryCode: 'RESPIRATORY',
  },

  // Vitamin (VITAMINS)
  {
    code: 'VITC500',
    name: 'Vitamin C 500mg',
    activeIngredient: 'Ascorbic acid',
    description: 'Bổ sung Vitamin C, tăng sức đề kháng',
    unit: 'TABLET',
    dosage: '500mg',
    manufacturer: 'DHG Pharma',
    requiresPrescription: false,
    categoryCode: 'VITAMINS',
  },
  {
    code: 'VITD1000',
    name: 'Vitamin D3 1000IU',
    activeIngredient: 'Cholecalciferol',
    description: 'Bổ sung Vitamin D, hỗ trợ xương khớp',
    unit: 'CAPSULE',
    dosage: '1000IU',
    manufacturer: 'Nature Made',
    requiresPrescription: false,
    categoryCode: 'VITAMINS',
  },
  {
    code: 'VITB',
    name: 'Vitamin B Complex',
    activeIngredient: 'Vitamin B1, B6, B12',
    description: 'Bổ sung vitamin nhóm B',
    unit: 'TABLET',
    dosage: 'Complex',
    manufacturer: 'Blackmores',
    requiresPrescription: false,
    categoryCode: 'VITAMINS',
  },
  {
    code: 'CALD',
    name: 'Calcium-D',
    activeIngredient: 'Calcium + Vitamin D3',
    description: 'Bổ sung canxi và vitamin D',
    unit: 'TABLET',
    dosage: '600mg + 400IU',
    manufacturer: 'Caltrate',
    requiresPrescription: false,
    categoryCode: 'VITAMINS',
  },

  // Đái tháo đường (DIABETES)
  {
    code: 'MET500',
    name: 'Metformin 500mg',
    activeIngredient: 'Metformin',
    description: 'Điều trị đái tháo đường type 2',
    unit: 'TABLET',
    dosage: '500mg',
    manufacturer: 'Merck',
    requiresPrescription: true,
    categoryCode: 'DIABETES',
  },
  {
    code: 'GLI30',
    name: 'Gliclazide 30mg',
    activeIngredient: 'Gliclazide',
    description: 'Điều trị đái tháo đường type 2',
    unit: 'TABLET',
    dosage: '30mg',
    manufacturer: 'Servier',
    requiresPrescription: true,
    categoryCode: 'DIABETES',
  },

  // Da liễu (DERMATOLOGY)
  {
    code: 'BET15',
    name: 'Betamethasone Cream 15g',
    activeIngredient: 'Betamethasone',
    description: 'Kem bôi chống viêm, ngứa da',
    unit: 'TUBE',
    dosage: '0.1%',
    manufacturer: 'Mediplantex',
    requiresPrescription: true,
    categoryCode: 'DERMATOLOGY',
  },
  {
    code: 'KET2',
    name: 'Ketoconazole Cream 2%',
    activeIngredient: 'Ketoconazole',
    description: 'Kem bôi điều trị nấm da',
    unit: 'TUBE',
    dosage: '2%',
    manufacturer: 'Janssen',
    requiresPrescription: false,
    categoryCode: 'DERMATOLOGY',
  },

  // Nhãn khoa (OPHTHALMOLOGY)
  {
    code: 'TOB5',
    name: 'Tobramycin Eye Drops 5ml',
    activeIngredient: 'Tobramycin',
    description: 'Thuốc nhỏ mắt kháng sinh',
    unit: 'BOTTLE',
    dosage: '0.3%',
    manufacturer: 'Alcon',
    requiresPrescription: true,
    categoryCode: 'OPHTHALMOLOGY',
  },
  {
    code: 'NAT15',
    name: 'Natri Clorid 0.9% Eye Drops 15ml',
    activeIngredient: 'Sodium chloride',
    description: 'Nước muối sinh lý nhỏ mắt',
    unit: 'BOTTLE',
    dosage: '0.9%',
    manufacturer: 'Bidiphar',
    requiresPrescription: false,
    categoryCode: 'OPHTHALMOLOGY',
  },
];

export async function seedMedicines(prisma: PrismaClient) {
  console.log('💉 Seeding medicines...');

  const categories = await prisma.medicineCategory.findMany();
  const categoryMap = new Map(categories.map((c) => [c.code, c.id]));

  for (const medicine of medicines) {
    const { categoryCode, ...medicineData } = medicine;
    const categoryId = categoryMap.get(categoryCode);

    await prisma.medicine.upsert({
      where: { code: medicine.code },
      update: {},
      create: {
        ...medicineData,
        categoryId,
      },
    });
  }

  console.log(`✅ Seeded ${medicines.length} medicines`);
}

export { medicines };


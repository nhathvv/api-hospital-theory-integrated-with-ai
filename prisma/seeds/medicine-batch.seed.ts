import { BatchStatus, PrismaClient } from '@prisma/client';

interface MedicineBatchSeed {
  medicineCode: string;
  batchNumber: string;
  quantity: number;
  currentStock: number;
  unitPrice: number;
  sellingPrice: number;
  manufactureDate: Date;
  expiryDate: Date;
  manufacturer: string;
  supplier: string;
  status: BatchStatus;
  notes?: string;
}

const generateBatches = (): MedicineBatchSeed[] => {
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), 1);
  const twoYearsLater = new Date(now.getFullYear() + 2, now.getMonth(), 1);
  const threeYearsLater = new Date(now.getFullYear() + 3, now.getMonth(), 1);
  const oneMonthLater = new Date(now.getFullYear(), now.getMonth() + 1, 15);

  return [
    {
      medicineCode: 'AMX500',
      batchNumber: 'AMX-2025-001',
      quantity: 1000,
      currentStock: 850,
      unitPrice: 2500,
      sellingPrice: 3500,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'Domesco',
      supplier: 'Pharma Distribution Co.',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'AMX500',
      batchNumber: 'AMX-2025-002',
      quantity: 500,
      currentStock: 45,
      unitPrice: 2500,
      sellingPrice: 3500,
      manufactureDate: threeMonthsAgo,
      expiryDate: oneYearLater,
      manufacturer: 'Domesco',
      supplier: 'MedSupply Vietnam',
      status: 'LOW_STOCK',
    },
    {
      medicineCode: 'AUG1G',
      batchNumber: 'AUG-2025-001',
      quantity: 500,
      currentStock: 420,
      unitPrice: 25000,
      sellingPrice: 35000,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'GSK',
      supplier: 'GSK Vietnam',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'PAR500',
      batchNumber: 'PAR-2025-001',
      quantity: 5000,
      currentStock: 4200,
      unitPrice: 500,
      sellingPrice: 1000,
      manufactureDate: oneMonthAgo,
      expiryDate: threeYearsLater,
      manufacturer: 'Nadyphar',
      supplier: 'National Pharma',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'PAR500',
      batchNumber: 'PAR-2025-002',
      quantity: 2000,
      currentStock: 150,
      unitPrice: 500,
      sellingPrice: 1000,
      manufactureDate: sixMonthsAgo,
      expiryDate: oneYearLater,
      manufacturer: 'Nadyphar',
      supplier: 'Pharma Distribution Co.',
      status: 'LOW_STOCK',
    },
    {
      medicineCode: 'IBU400',
      batchNumber: 'IBU-2025-001',
      quantity: 2000,
      currentStock: 1650,
      unitPrice: 800,
      sellingPrice: 1500,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'Pharmacity',
      supplier: 'MedSupply Vietnam',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'OME20',
      batchNumber: 'OME-2025-001',
      quantity: 1000,
      currentStock: 780,
      unitPrice: 3000,
      sellingPrice: 5000,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'AstraZeneca',
      supplier: 'AstraZeneca Vietnam',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'CET10',
      batchNumber: 'CET-2025-001',
      quantity: 3000,
      currentStock: 2500,
      unitPrice: 1000,
      sellingPrice: 2000,
      manufactureDate: oneMonthAgo,
      expiryDate: threeYearsLater,
      manufacturer: 'Sanofi',
      supplier: 'Sanofi Vietnam',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'AML5',
      batchNumber: 'AML-2025-001',
      quantity: 1000,
      currentStock: 850,
      unitPrice: 5000,
      sellingPrice: 8000,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'Pfizer',
      supplier: 'Pfizer Vietnam',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'MET500',
      batchNumber: 'MET-2025-001',
      quantity: 2000,
      currentStock: 1800,
      unitPrice: 1500,
      sellingPrice: 2500,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'Merck',
      supplier: 'Merck Vietnam',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'VITC500',
      batchNumber: 'VTC-2025-001',
      quantity: 5000,
      currentStock: 4500,
      unitPrice: 300,
      sellingPrice: 700,
      manufactureDate: oneMonthAgo,
      expiryDate: threeYearsLater,
      manufacturer: 'DHG Pharma',
      supplier: 'DHG Distribution',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'SAL2',
      batchNumber: 'SAL-2025-001',
      quantity: 800,
      currentStock: 0,
      unitPrice: 2000,
      sellingPrice: 3500,
      manufactureDate: sixMonthsAgo,
      expiryDate: oneYearLater,
      manufacturer: 'GSK',
      supplier: 'GSK Vietnam',
      status: 'OUT_OF_STOCK',
      notes: 'Pending restock order',
    },
    {
      medicineCode: 'BRO8',
      batchNumber: 'BRO-2025-001',
      quantity: 1500,
      currentStock: 1200,
      unitPrice: 1200,
      sellingPrice: 2200,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'Boehringer',
      supplier: 'Boehringer Ingelheim Vietnam',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'DOM10',
      batchNumber: 'DOM-2025-001',
      quantity: 2000,
      currentStock: 1750,
      unitPrice: 1000,
      sellingPrice: 1800,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'Janssen',
      supplier: 'Johnson & Johnson Vietnam',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'LOS50',
      batchNumber: 'LOS-2025-001',
      quantity: 1000,
      currentStock: 25,
      unitPrice: 6000,
      sellingPrice: 10000,
      manufactureDate: threeMonthsAgo,
      expiryDate: oneYearLater,
      manufacturer: 'Merck',
      supplier: 'Merck Vietnam',
      status: 'LOW_STOCK',
    },
    {
      medicineCode: 'ATO20',
      batchNumber: 'ATO-2025-001',
      quantity: 1000,
      currentStock: 900,
      unitPrice: 8000,
      sellingPrice: 12000,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'Pfizer',
      supplier: 'Pfizer Vietnam',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'SME3G',
      batchNumber: 'SME-2024-001',
      quantity: 500,
      currentStock: 0,
      unitPrice: 5000,
      sellingPrice: 8000,
      manufactureDate: new Date(2023, 5, 1),
      expiryDate: oneMonthLater,
      manufacturer: 'Ipsen',
      supplier: 'Ipsen Vietnam',
      status: 'EXPIRED',
      notes: 'Scheduled for disposal',
    },
    {
      medicineCode: 'BET15',
      batchNumber: 'BET-2025-001',
      quantity: 500,
      currentStock: 420,
      unitPrice: 15000,
      sellingPrice: 25000,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'Mediplantex',
      supplier: 'Mediplantex Distribution',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'TOB5',
      batchNumber: 'TOB-2025-001',
      quantity: 300,
      currentStock: 250,
      unitPrice: 35000,
      sellingPrice: 55000,
      manufactureDate: oneMonthAgo,
      expiryDate: oneYearLater,
      manufacturer: 'Alcon',
      supplier: 'Alcon Vietnam',
      status: 'IN_STOCK',
    },
    {
      medicineCode: 'CEF200',
      batchNumber: 'CEF-2025-001',
      quantity: 800,
      currentStock: 650,
      unitPrice: 8000,
      sellingPrice: 12000,
      manufactureDate: oneMonthAgo,
      expiryDate: twoYearsLater,
      manufacturer: 'Sanofi',
      supplier: 'Sanofi Vietnam',
      status: 'IN_STOCK',
    },
  ];
};

export async function seedMedicineBatches(prisma: PrismaClient) {
  console.log('📦 Seeding medicine batches...');

  const medicines = await prisma.medicine.findMany();
  const medicineMap = new Map(medicines.map((m) => [m.code, m.id]));

  const batches = generateBatches();
  let seededCount = 0;

  for (const batch of batches) {
    const { medicineCode, ...batchData } = batch;
    const medicineId = medicineMap.get(medicineCode);

    if (!medicineId) {
      console.warn(`⚠️ Medicine with code ${medicineCode} not found, skipping batch ${batch.batchNumber}`);
      continue;
    }

    await prisma.medicineBatch.upsert({
      where: {
        medicineId_batchNumber: {
          medicineId,
          batchNumber: batch.batchNumber,
        },
      },
      update: {},
      create: {
        ...batchData,
        medicineId,
      },
    });
    seededCount++;
  }

  console.log(`✅ Seeded ${seededCount} medicine batches`);
}


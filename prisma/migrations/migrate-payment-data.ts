import { PrismaClient, PaymentType } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePaymentData() {
  console.log('🚀 Starting Payment data migration...');

  const payments = await prisma.payment.findMany({
    where: {
      amount: 0,
    },
    include: {
      appointment: {
        select: {
          consultationFee: true,
          medicineFee: true,
        },
      },
    },
  });

  console.log(`📦 Found ${payments.length} payments with amount=0 to migrate`);

  if (payments.length === 0) {
    console.log('✅ No payments need migration');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const payment of payments) {
    try {
      const isMedicinePayment = payment.type === PaymentType.MEDICINE;
      const amount = isMedicinePayment
        ? (payment.appointment?.medicineFee ?? 0)
        : (payment.appointment?.consultationFee ?? 0);

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          amount: amount,
        },
      });

      successCount++;
      console.log(
        `✅ Updated payment ${payment.paymentCode}: type=${payment.type}, amount=${amount}`,
      );
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to update payment ${payment.paymentCode}:`, error);
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Total: ${payments.length}`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${errorCount}`);
}

migratePaymentData()
  .then(() => {
    console.log('\n🎉 Payment data migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

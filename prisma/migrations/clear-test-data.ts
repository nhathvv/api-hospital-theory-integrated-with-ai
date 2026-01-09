import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearTestData() {
  console.log('🗑️  Starting to clear test data...\n');

  try {
    const paymentTransactionCount = await prisma.paymentTransaction.count();
    const paymentCount = await prisma.payment.count();
    const prescriptionItemCount = await prisma.prescriptionItem.count();
    const appointmentDocumentCount = await prisma.appointmentDocument.count();
    const appointmentCount = await prisma.appointment.count();

    console.log('📊 Current data counts:');
    console.log(`   PaymentTransaction: ${paymentTransactionCount}`);
    console.log(`   Payment: ${paymentCount}`);
    console.log(`   PrescriptionItem: ${prescriptionItemCount}`);
    console.log(`   AppointmentDocument: ${appointmentDocumentCount}`);
    console.log(`   Appointment: ${appointmentCount}`);
    console.log('');

    console.log('🔄 Deleting in order (child → parent)...\n');

    const deletedPaymentTransactions = await prisma.paymentTransaction.deleteMany({});
    console.log(`✅ Deleted ${deletedPaymentTransactions.count} PaymentTransaction records`);

    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✅ Deleted ${deletedPayments.count} Payment records`);

    const deletedPrescriptionItems = await prisma.prescriptionItem.deleteMany({});
    console.log(`✅ Deleted ${deletedPrescriptionItems.count} PrescriptionItem records`);

    const deletedAppointmentDocuments = await prisma.appointmentDocument.deleteMany({});
    console.log(`✅ Deleted ${deletedAppointmentDocuments.count} AppointmentDocument records`);

    const deletedAppointments = await prisma.appointment.deleteMany({});
    console.log(`✅ Deleted ${deletedAppointments.count} Appointment records`);

    console.log('\n🎉 All test data cleared successfully!');
    console.log('\n📋 You can now test the new payment flow:');
    console.log('   1. Patient books appointment → PENDING + CONSULTATION payment');
    console.log('   2. Patient pays consultation fee → CONFIRMED');
    console.log('   3. Doctor examines & creates prescription → IN_PROGRESS + MEDICINE payment');
    console.log('   4. Patient pays medicine fee → COMPLETED');

  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

clearTestData()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

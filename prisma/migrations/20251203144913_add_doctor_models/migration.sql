-- CreateEnum
CREATE TYPE "DoctorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "fullName" TEXT;

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primarySpecialtyId" TEXT NOT NULL,
    "subSpecialty" TEXT,
    "professionalTitle" TEXT,
    "yearsOfExperience" INTEGER NOT NULL,
    "consultationFee" DECIMAL(10,2) NOT NULL,
    "bio" TEXT,
    "status" "DoctorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_educations" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_awards" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_certifications" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "certificateName" TEXT NOT NULL,
    "issuingAuthority" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctors_userId_key" ON "doctors"("userId");

-- CreateIndex
CREATE INDEX "doctor_educations_doctorId_idx" ON "doctor_educations"("doctorId");

-- CreateIndex
CREATE INDEX "doctor_awards_doctorId_idx" ON "doctor_awards"("doctorId");

-- CreateIndex
CREATE INDEX "doctor_certifications_doctorId_idx" ON "doctor_certifications"("doctorId");

-- CreateIndex
CREATE INDEX "doctor_certifications_licenseNumber_idx" ON "doctor_certifications"("licenseNumber");

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_primarySpecialtyId_fkey" FOREIGN KEY ("primarySpecialtyId") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_educations" ADD CONSTRAINT "doctor_educations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_awards" ADD CONSTRAINT "doctor_awards_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_certifications" ADD CONSTRAINT "doctor_certifications_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

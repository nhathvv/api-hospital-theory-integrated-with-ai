import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { DocumentType } from './dto';

interface CreateDocumentData {
  title: string;
  documentType: DocumentType;
  documentUrl: string;
  notes?: string;
  fileContentHash?: string;
}

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUserAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true },
    });
  }

  async createAppointmentDocument(
    appointmentId: string,
    userId: string,
    data: CreateDocumentData,
  ) {
    await this.validateAppointmentAccess(appointmentId, userId);

    return this.prisma.appointmentDocument.create({
      data: {
        appointmentId,
        uploadedById: userId,
        title: data.title,
        documentType: data.documentType,
        documentUrl: data.documentUrl,
        notes: data.notes,
        fileContentHash: data.fileContentHash,
      },
    });
  }

  async createMultipleAppointmentDocuments(
    appointmentId: string,
    userId: string,
    documents: CreateDocumentData[],
  ) {
    await this.validateAppointmentAccess(appointmentId, userId);

    const createPromises = documents.map((doc) =>
      this.prisma.appointmentDocument.create({
        data: {
          appointmentId,
          uploadedById: userId,
          title: doc.title,
          documentType: doc.documentType,
          documentUrl: doc.documentUrl,
          notes: doc.notes,
          fileContentHash: doc.fileContentHash,
        },
      }),
    );

    return Promise.all(createPromises);
  }

  async getDoctorDocuments(doctorId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { userId: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const isDoctor = doctor.userId === userId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isDoctor && !isAdmin) {
      throw new ForbiddenException('Not authorized to view doctor documents');
    }

    const documents = await this.prisma.appointmentDocument.findMany({
      where: {
        appointment: {
          doctorId,
        },
      },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            patient: {
              select: {
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      documentType: doc.documentType,
      documentUrl: doc.documentUrl,
      notes: doc.notes,
      createdAt: doc.createdAt,
      appointmentId: doc.appointmentId,
      appointmentDate: doc.appointment.appointmentDate,
      patientName: doc.appointment.patient.user.fullName,
    }));
  }

  async getPatientDocuments(patientId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { userId: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const isPatient = patient.userId === userId;
    const isDoctor = user?.role === 'DOCTOR';
    const isAdmin = user?.role === 'ADMIN';

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException('Not authorized to view patient documents');
    }

    const documents = await this.prisma.appointmentDocument.findMany({
      where: {
        appointment: {
          patientId,
        },
      },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            doctor: {
              select: {
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      documentType: doc.documentType,
      documentUrl: doc.documentUrl,
      notes: doc.notes,
      createdAt: doc.createdAt,
      appointmentId: doc.appointmentId,
      appointmentDate: doc.appointment.appointmentDate,
      doctorName: doc.appointment.doctor.user.fullName,
    }));
  }

  async getDocumentById(documentId: string) {
    const document = await this.prisma.appointmentDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async deleteAppointmentDocument(documentId: string, userId: string) {
    const document = await this.prisma.appointmentDocument.findUnique({
      where: { id: documentId },
      include: {
        appointment: {
          select: {
            patient: { select: { userId: true } },
            doctor: { select: { userId: true } },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isOwner = document.uploadedById === userId;
    const isPatient = document.appointment.patient.userId === userId;
    const isDoctor = document.appointment.doctor.userId === userId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException('Not authorized to delete this document');
    }

    return this.prisma.appointmentDocument.delete({
      where: { id: documentId },
    });
  }

  private async validateAppointmentAccess(
    appointmentId: string,
    userId: string,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        patient: { select: { userId: true } },
        doctor: { select: { userId: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isPatient = appointment.patient.userId === userId;
    const isDoctor = appointment.doctor.userId === userId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException(
        'Not authorized to upload documents for this appointment',
      );
    }

    return appointment;
  }
}


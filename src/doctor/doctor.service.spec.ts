import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { PrismaService } from '../prisma';
import { UserService } from '../user';
import { CreateDoctorDto } from './dto';
import { DoctorStatus } from '@prisma/client';
import { UserRole } from '../common/constants';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('../common/utils/transaction.util', () => ({
  TransactionUtil: {
    executeInTransaction: jest.fn((prisma, callback) => callback(prisma)),
  },
}));

describe('DoctorService - create', () => {
  let service: DoctorService;
  let prismaService: PrismaService;
  let userService: UserService;

  const mockPrismaService = {
    doctor: {
      create: jest.fn(),
    },
    specialty: {
      findUnique: jest.fn(),
    },
    doctorCertification: {
      findMany: jest.fn(),
    },
  };

  const mockUserService = {
    findByEmail: jest.fn(),
    createUserInTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
    prismaService = module.get<PrismaService>(PrismaService);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validCreateDoctorDto: CreateDoctorDto = {
      email: 'doctor@example.com',
      username: 'dr.john',
      phone: '+84123456789',
      fullName: 'Dr. John Doe',
      avatar: '/uploads/avatars/doctor-123.jpg',
      address: '123 Medical Street, Hanoi',
      primarySpecialtyId: '550e8400-e29b-41d4-a716-446655440001',
      subSpecialty: 'Interventional Cardiology',
      professionalTitle: 'Associate Professor',
      yearsOfExperience: 10,
      consultationFee: 500000,
      bio: 'Experienced cardiologist',
      educations: [
        {
          school: 'University of Medicine and Pharmacy',
          degree: 'MD, Cardiology',
          graduationYear: 2015,
        },
      ],
      certifications: [
        {
          certificateName: 'Medical Practice License',
          issuingAuthority: 'Vietnam Ministry of Health',
          licenseNumber: 'HN-12345',
          issueDate: '2015-06-01',
          expiryDate: '2025-06-01',
          documentUrl: '/uploads/certifications/doc-123.pdf',
        },
      ],
      awards: [
        {
          title: 'National Clinical Excellence Award',
          organization: 'Vietnam Medical Association',
          year: 2021,
          description: 'Excellence in cardiovascular care',
        },
      ],
      status: DoctorStatus.ACTIVE,
    };

    const mockSpecialty = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Cardiology',
      description: 'Heart and cardiovascular system',
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'doctor@example.com',
      username: 'dr.john',
      phone: '+84123456789',
      fullName: 'Dr. John Doe',
      avatar: '/uploads/avatars/doctor-123.jpg',
      address: '123 Medical Street, Hanoi',
      role: UserRole.DOCTOR,
      password: 'hashedPassword',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    describe('Successful creation', () => {
      it('should create doctor with all fields successfully', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockPrismaService.specialty.findUnique.mockResolvedValue(mockSpecialty);
        mockPrismaService.doctorCertification.findMany.mockResolvedValue([]);
        mockUserService.createUserInTransaction.mockResolvedValue(mockUser);

        const mockCreatedDoctor = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: mockUser.id,
          primarySpecialtyId: validCreateDoctorDto.primarySpecialtyId,
          subSpecialty: validCreateDoctorDto.subSpecialty,
          professionalTitle: validCreateDoctorDto.professionalTitle,
          yearsOfExperience: validCreateDoctorDto.yearsOfExperience,
          consultationFee: validCreateDoctorDto.consultationFee,
          bio: validCreateDoctorDto.bio,
          status: DoctorStatus.ACTIVE,
          deletedAt: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: mockUser.username,
            phone: mockUser.phone,
            fullName: mockUser.fullName,
            avatar: mockUser.avatar,
            address: mockUser.address,
            role: mockUser.role,
          },
          primarySpecialty: mockSpecialty,
          educations: [
            {
              id: '550e8400-e29b-41d4-a716-446655440003',
              doctorId: '550e8400-e29b-41d4-a716-446655440000',
              school: 'University of Medicine and Pharmacy',
              degree: 'MD, Cardiology',
              graduationYear: 2015,
              createdAt: new Date('2024-01-01T00:00:00.000Z'),
              updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            },
          ],
          certifications: [
            {
              id: '550e8400-e29b-41d4-a716-446655440004',
              doctorId: '550e8400-e29b-41d4-a716-446655440000',
              certificateName: 'Medical Practice License',
              issuingAuthority: 'Vietnam Ministry of Health',
              licenseNumber: 'HN-12345',
              issueDate: new Date('2015-06-01'),
              expiryDate: new Date('2025-06-01'),
              documentUrl: '/uploads/certifications/doc-123.pdf',
              createdAt: new Date('2024-01-01T00:00:00.000Z'),
              updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            },
          ],
          awards: [
            {
              id: '550e8400-e29b-41d4-a716-446655440005',
              doctorId: '550e8400-e29b-41d4-a716-446655440000',
              title: 'National Clinical Excellence Award',
              organization: 'Vietnam Medical Association',
              year: 2021,
              description: 'Excellence in cardiovascular care',
              createdAt: new Date('2024-01-01T00:00:00.000Z'),
              updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            },
          ],
        };

        mockPrismaService.doctor.create.mockResolvedValue(mockCreatedDoctor);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedTempPassword');

        const result = await service.create(validCreateDoctorDto);

        expect(result).toBeDefined();
        expect(result.temporaryPassword).toBeDefined();
        expect(result.temporaryPassword).toHaveLength(16);
        expect(result.user.email).toBe(validCreateDoctorDto.email);
        expect(result.user.role).toBe(UserRole.DOCTOR);
        expect(result.educations).toHaveLength(1);
        expect(result.certifications).toHaveLength(1);
        expect(result.awards).toHaveLength(1);
        expect(result.status).toBe(DoctorStatus.ACTIVE);

        expect(userService.findByEmail).toHaveBeenCalledWith(validCreateDoctorDto.email);
        expect(prismaService.specialty.findUnique).toHaveBeenCalledWith({
          where: { id: validCreateDoctorDto.primarySpecialtyId },
        });
        expect(prismaService.doctorCertification.findMany).toHaveBeenCalledWith({
          where: {
            licenseNumber: {
              in: ['HN-12345'],
            },
          },
        });
        expect(userService.createUserInTransaction).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            email: validCreateDoctorDto.email,
            username: validCreateDoctorDto.username,
            phone: validCreateDoctorDto.phone,
            fullName: validCreateDoctorDto.fullName,
            role: UserRole.DOCTOR,
          }),
        );
        expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
        expect(prismaService.doctor.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: mockUser.id,
              primarySpecialtyId: validCreateDoctorDto.primarySpecialtyId,
              yearsOfExperience: validCreateDoctorDto.yearsOfExperience,
              consultationFee: validCreateDoctorDto.consultationFee,
              status: DoctorStatus.ACTIVE,
            }),
          }),
        );
      });

      it('should create doctor with only required fields', async () => {
        const minimalDto: CreateDoctorDto = {
          email: 'minimal@example.com',
          username: 'dr.minimal',
          phone: '+84987654321',
          fullName: 'Dr. Minimal',
          primarySpecialtyId: '550e8400-e29b-41d4-a716-446655440001',
          yearsOfExperience: 5,
          consultationFee: 300000,
          educations: [
            {
              school: 'Hanoi Medical University',
              degree: 'MD',
              graduationYear: 2018,
            },
          ],
          certifications: [
            {
              certificateName: 'Basic Medical License',
              issuingAuthority: 'Ministry of Health',
              licenseNumber: 'HN-54321',
              issueDate: '2018-07-01',
            },
          ],
        };

        mockUserService.findByEmail.mockResolvedValue(null);
        mockPrismaService.specialty.findUnique.mockResolvedValue(mockSpecialty);
        mockPrismaService.doctorCertification.findMany.mockResolvedValue([]);
        mockUserService.createUserInTransaction.mockResolvedValue({
          ...mockUser,
          email: minimalDto.email,
          username: minimalDto.username,
          avatar: null,
          address: null,
        });

        const mockMinimalDoctor = {
          id: '550e8400-e29b-41d4-a716-446655440010',
          userId: mockUser.id,
          primarySpecialtyId: minimalDto.primarySpecialtyId,
          subSpecialty: null,
          professionalTitle: null,
          yearsOfExperience: minimalDto.yearsOfExperience,
          consultationFee: minimalDto.consultationFee,
          bio: null,
          status: DoctorStatus.ACTIVE,
          deletedAt: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          user: {
            id: mockUser.id,
            email: minimalDto.email,
            username: minimalDto.username,
            phone: minimalDto.phone,
            fullName: minimalDto.fullName,
            avatar: null,
            address: null,
            role: UserRole.DOCTOR,
          },
          primarySpecialty: mockSpecialty,
          educations: [
            {
              id: '550e8400-e29b-41d4-a716-446655440011',
              doctorId: '550e8400-e29b-41d4-a716-446655440010',
              school: 'Hanoi Medical University',
              degree: 'MD',
              graduationYear: 2018,
              createdAt: new Date('2024-01-01T00:00:00.000Z'),
              updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            },
          ],
          certifications: [
            {
              id: '550e8400-e29b-41d4-a716-446655440012',
              doctorId: '550e8400-e29b-41d4-a716-446655440010',
              certificateName: 'Basic Medical License',
              issuingAuthority: 'Ministry of Health',
              licenseNumber: 'HN-54321',
              issueDate: new Date('2018-07-01'),
              expiryDate: null,
              documentUrl: null,
              createdAt: new Date('2024-01-01T00:00:00.000Z'),
              updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            },
          ],
          awards: [],
        };

        mockPrismaService.doctor.create.mockResolvedValue(mockMinimalDoctor);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedTempPassword');

        const result = await service.create(minimalDto);

        expect(result).toBeDefined();
        expect(result.temporaryPassword).toBeDefined();
        expect(result.awards).toHaveLength(0);
        expect(result.subSpecialty).toBeNull();
        expect(result.professionalTitle).toBeNull();
        expect(result.bio).toBeNull();

        expect(prismaService.doctor.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: mockUser.id,
              primarySpecialtyId: minimalDto.primarySpecialtyId,
              status: DoctorStatus.ACTIVE,
            }),
          }),
        );
      });

      it('should create doctor with multiple educations and certifications', async () => {
        const multiDto: CreateDoctorDto = {
          ...validCreateDoctorDto,
          educations: [
            {
              school: 'University of Medicine',
              degree: 'MD',
              graduationYear: 2008,
            },
            {
              school: 'Harvard Medical School',
              degree: 'PhD, Neurology',
              graduationYear: 2012,
            },
          ],
          certifications: [
            {
              certificateName: 'Medical Practice License',
              issuingAuthority: 'Ministry of Health',
              licenseNumber: 'HN-99999',
              issueDate: '2008-06-01',
            },
            {
              certificateName: 'Board Certification',
              issuingAuthority: 'Medical Board',
              licenseNumber: 'US-12345',
              issueDate: '2012-08-01',
            },
          ],
        };

        mockUserService.findByEmail.mockResolvedValue(null);
        mockPrismaService.specialty.findUnique.mockResolvedValue(mockSpecialty);
        mockPrismaService.doctorCertification.findMany.mockResolvedValue([]);
        mockUserService.createUserInTransaction.mockResolvedValue(mockUser);

        const mockMultiDoctor = {
          id: '550e8400-e29b-41d4-a716-446655440020',
          userId: mockUser.id,
          primarySpecialtyId: multiDto.primarySpecialtyId,
          subSpecialty: multiDto.subSpecialty,
          professionalTitle: multiDto.professionalTitle,
          yearsOfExperience: multiDto.yearsOfExperience,
          consultationFee: multiDto.consultationFee,
          bio: multiDto.bio,
          status: DoctorStatus.ACTIVE,
          deletedAt: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: mockUser.username,
            phone: mockUser.phone,
            fullName: mockUser.fullName,
            avatar: mockUser.avatar,
            address: mockUser.address,
            role: UserRole.DOCTOR,
          },
          primarySpecialty: mockSpecialty,
          educations: multiDto.educations.map((edu, index) => ({
            id: `550e8400-e29b-41d4-a716-44665544002${index}`,
            doctorId: '550e8400-e29b-41d4-a716-446655440020',
            ...edu,
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          })),
          certifications: multiDto.certifications.map((cert, index) => ({
            id: `550e8400-e29b-41d4-a716-44665544002${index + 2}`,
            doctorId: '550e8400-e29b-41d4-a716-446655440020',
            certificateName: cert.certificateName,
            issuingAuthority: cert.issuingAuthority,
            licenseNumber: cert.licenseNumber,
            issueDate: new Date(cert.issueDate),
            expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
            documentUrl: cert.documentUrl || null,
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          })),
          awards: [
            {
              id: '550e8400-e29b-41d4-a716-446655440025',
              doctorId: '550e8400-e29b-41d4-a716-446655440020',
              title: 'National Clinical Excellence Award',
              organization: 'Vietnam Medical Association',
              year: 2021,
              description: 'Excellence in cardiovascular care',
              createdAt: new Date('2024-01-01T00:00:00.000Z'),
              updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            },
          ],
        };

        mockPrismaService.doctor.create.mockResolvedValue(mockMultiDoctor);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedTempPassword');

        const result = await service.create(multiDto);

        expect(result).toBeDefined();
        expect(result.educations).toHaveLength(2);
        expect(result.certifications).toHaveLength(2);
        expect(prismaService.doctorCertification.findMany).toHaveBeenCalledWith({
          where: {
            licenseNumber: {
              in: ['HN-99999', 'US-12345'],
            },
          },
        });
      });
    });

    describe('Validation errors', () => {
      it('should throw ConflictException when email already exists', async () => {
        mockUserService.findByEmail.mockResolvedValue(mockUser);
        mockPrismaService.specialty.findUnique.mockResolvedValue(mockSpecialty);
        mockPrismaService.doctorCertification.findMany.mockResolvedValue([]);

        await expect(service.create(validCreateDoctorDto)).rejects.toThrow(
          ConflictException,
        );
        await expect(service.create(validCreateDoctorDto)).rejects.toThrow(
          'Email already exists',
        );

        expect(userService.findByEmail).toHaveBeenCalledWith(validCreateDoctorDto.email);
        expect(prismaService.doctor.create).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException when specialty not found', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockPrismaService.specialty.findUnique.mockResolvedValue(null);
        mockPrismaService.doctorCertification.findMany.mockResolvedValue([]);

        await expect(service.create(validCreateDoctorDto)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.create(validCreateDoctorDto)).rejects.toThrow(
          'Primary specialty not found',
        );

        expect(prismaService.specialty.findUnique).toHaveBeenCalledWith({
          where: { id: validCreateDoctorDto.primarySpecialtyId },
        });
        expect(prismaService.doctor.create).not.toHaveBeenCalled();
      });

      it('should throw ConflictException when specialty is not active', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockPrismaService.specialty.findUnique.mockResolvedValue({
          ...mockSpecialty,
          isActive: false,
        });
        mockPrismaService.doctorCertification.findMany.mockResolvedValue([]);

        await expect(service.create(validCreateDoctorDto)).rejects.toThrow(
          ConflictException,
        );
        await expect(service.create(validCreateDoctorDto)).rejects.toThrow(
          'Primary specialty is not active',
        );

        expect(prismaService.doctor.create).not.toHaveBeenCalled();
      });

      it('should throw ConflictException when license number already exists', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockPrismaService.specialty.findUnique.mockResolvedValue(mockSpecialty);
        mockPrismaService.doctorCertification.findMany.mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440099',
            doctorId: '550e8400-e29b-41d4-a716-446655440098',
            certificateName: 'Existing License',
            issuingAuthority: 'Authority',
            licenseNumber: 'HN-12345',
            issueDate: new Date('2015-06-01'),
            expiryDate: null,
            documentUrl: null,
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ]);

        await expect(service.create(validCreateDoctorDto)).rejects.toThrow(
          ConflictException,
        );
        await expect(service.create(validCreateDoctorDto)).rejects.toThrow(
          'License number(s) already exist: HN-12345',
        );

        expect(prismaService.doctorCertification.findMany).toHaveBeenCalledWith({
          where: {
            licenseNumber: {
              in: ['HN-12345'],
            },
          },
        });
        expect(prismaService.doctor.create).not.toHaveBeenCalled();
      });

      it('should throw ConflictException when multiple license numbers already exist', async () => {
        const multiLicenseDto: CreateDoctorDto = {
          ...validCreateDoctorDto,
          certifications: [
            {
              certificateName: 'License 1',
              issuingAuthority: 'Authority 1',
              licenseNumber: 'HN-11111',
              issueDate: '2015-06-01',
            },
            {
              certificateName: 'License 2',
              issuingAuthority: 'Authority 2',
              licenseNumber: 'HN-22222',
              issueDate: '2016-06-01',
            },
          ],
        };

        mockUserService.findByEmail.mockResolvedValue(null);
        mockPrismaService.specialty.findUnique.mockResolvedValue(mockSpecialty);
        mockPrismaService.doctorCertification.findMany.mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440099',
            doctorId: '550e8400-e29b-41d4-a716-446655440098',
            certificateName: 'Existing License 1',
            issuingAuthority: 'Authority',
            licenseNumber: 'HN-11111',
            issueDate: new Date('2015-06-01'),
            expiryDate: null,
            documentUrl: null,
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440100',
            doctorId: '550e8400-e29b-41d4-a716-446655440098',
            certificateName: 'Existing License 2',
            issuingAuthority: 'Authority',
            licenseNumber: 'HN-22222',
            issueDate: new Date('2016-06-01'),
            expiryDate: null,
            documentUrl: null,
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ]);

        await expect(service.create(multiLicenseDto)).rejects.toThrow(
          ConflictException,
        );
        await expect(service.create(multiLicenseDto)).rejects.toThrow(
          'License number(s) already exist: HN-11111, HN-22222',
        );

        expect(prismaService.doctor.create).not.toHaveBeenCalled();
      });
    });

    describe('Password generation and hashing', () => {
      it('should generate temporary password with correct length', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockPrismaService.specialty.findUnique.mockResolvedValue(mockSpecialty);
        mockPrismaService.doctorCertification.findMany.mockResolvedValue([]);
        mockUserService.createUserInTransaction.mockResolvedValue(mockUser);

        const mockCreatedDoctor = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: mockUser.id,
          primarySpecialtyId: validCreateDoctorDto.primarySpecialtyId,
          subSpecialty: validCreateDoctorDto.subSpecialty,
          professionalTitle: validCreateDoctorDto.professionalTitle,
          yearsOfExperience: validCreateDoctorDto.yearsOfExperience,
          consultationFee: validCreateDoctorDto.consultationFee,
          bio: validCreateDoctorDto.bio,
          status: DoctorStatus.ACTIVE,
          deletedAt: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: mockUser.username,
            phone: mockUser.phone,
            fullName: mockUser.fullName,
            avatar: mockUser.avatar,
            address: mockUser.address,
            role: UserRole.DOCTOR,
          },
          primarySpecialty: mockSpecialty,
          educations: [],
          certifications: [],
          awards: [],
        };

        mockPrismaService.doctor.create.mockResolvedValue(mockCreatedDoctor);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedTempPassword');

        const result = await service.create(validCreateDoctorDto);

        expect(result.temporaryPassword).toHaveLength(16);
        expect(bcrypt.hash).toHaveBeenCalledWith(result.temporaryPassword, 10);
      });

      it('should hash password before creating user', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockPrismaService.specialty.findUnique.mockResolvedValue(mockSpecialty);
        mockPrismaService.doctorCertification.findMany.mockResolvedValue([]);
        mockUserService.createUserInTransaction.mockResolvedValue(mockUser);

        const mockCreatedDoctor = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: mockUser.id,
          primarySpecialtyId: validCreateDoctorDto.primarySpecialtyId,
          subSpecialty: validCreateDoctorDto.subSpecialty,
          professionalTitle: validCreateDoctorDto.professionalTitle,
          yearsOfExperience: validCreateDoctorDto.yearsOfExperience,
          consultationFee: validCreateDoctorDto.consultationFee,
          bio: validCreateDoctorDto.bio,
          status: DoctorStatus.ACTIVE,
          deletedAt: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: mockUser.username,
            phone: mockUser.phone,
            fullName: mockUser.fullName,
            avatar: mockUser.avatar,
            address: mockUser.address,
            role: UserRole.DOCTOR,
          },
          primarySpecialty: mockSpecialty,
          educations: [],
          certifications: [],
          awards: [],
        };

        mockPrismaService.doctor.create.mockResolvedValue(mockCreatedDoctor);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedTempPassword');

        await service.create(validCreateDoctorDto);

        expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
        expect(userService.createUserInTransaction).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            password: 'hashedTempPassword',
          }),
        );
      });
    });
  });
});


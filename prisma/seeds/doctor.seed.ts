import { DayOfWeek, ExaminationType, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

interface DoctorSeedData {
  user: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    address?: string;
    avatar?: string;
  };
  doctor: {
    specialtyName: string;
    subSpecialty?: string;
    professionalTitle: string;
    yearsOfExperience: number;
    consultationFee: number;
    bio: string;
  };
  educations: {
    school: string;
    degree: string;
    graduationYear: number;
  }[];
  awards: {
    title: string;
    organization: string;
    year: number;
    description?: string;
  }[];
  certifications: {
    certificateName: string;
    issuingAuthority: string;
    licenseNumber: string;
    issueDate: Date;
    expiryDate?: Date;
  }[];
  schedule: {
    timeSlots: {
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      examinationType: ExaminationType;
      maxPatients: number;
    }[];
  };
}

const doctors: DoctorSeedData[] = [
  {
    user: {
      email: 'bs.nguyenvana@hospital.com',
      password: 'Doctor@123',
      fullName: 'PGS.TS.BS Nguyễn Văn An',
      phone: '0901111001',
      address: '123 Nguyễn Du, Quận 1, TP.HCM',
    },
    doctor: {
      specialtyName: 'Nội Tim mạch',
      subSpecialty: 'Can thiệp mạch vành, Siêu âm tim',
      professionalTitle: 'Phó Giáo sư, Tiến sĩ, Bác sĩ',
      yearsOfExperience: 25,
      consultationFee: 500000,
      bio: 'PGS.TS.BS Nguyễn Văn An là chuyên gia hàng đầu về Tim mạch can thiệp với hơn 25 năm kinh nghiệm. Ông đã thực hiện hơn 5000 ca can thiệp mạch vành thành công. Chuyên môn sâu về điều trị bệnh mạch vành, suy tim, rối loạn nhịp tim, tăng huyết áp và các bệnh lý tim mạch phức tạp. Ông là tác giả của nhiều công trình nghiên cứu khoa học được công bố trên các tạp chí y khoa quốc tế.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 1999 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Thạc sĩ Tim mạch học', graduationYear: 2003 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Tiến sĩ Y học', graduationYear: 2008 },
      { school: 'Harvard Medical School', degree: 'Fellowship Tim mạch can thiệp', graduationYear: 2010 },
    ],
    awards: [
      { title: 'Thầy thuốc Ưu tú', organization: 'Bộ Y tế Việt Nam', year: 2018, description: 'Danh hiệu cao quý dành cho bác sĩ có đóng góp xuất sắc' },
      { title: 'Giải thưởng Nghiên cứu Khoa học Xuất sắc', organization: 'Hội Tim mạch Việt Nam', year: 2020 },
      { title: 'Top 100 Bác sĩ Tim mạch Châu Á', organization: 'Asian Heart Association', year: 2022 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-001234', issueDate: new Date('2000-01-15') },
      { certificateName: 'Chứng nhận Can thiệp mạch vành', issuingAuthority: 'Hội Tim mạch Việt Nam', licenseNumber: 'CTMV-2010-089', issueDate: new Date('2010-06-20'), expiryDate: new Date('2030-06-20') },
      { certificateName: 'ACLS Provider', issuingAuthority: 'American Heart Association', licenseNumber: 'AHA-ACLS-2023-VN001', issueDate: new Date('2023-03-15'), expiryDate: new Date('2025-03-15') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'MONDAY', startTime: '13:30', endTime: '17:00', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '16:00', examinationType: 'ONLINE', maxPatients: 8 },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
      ],
    },
  },
  {
    user: {
      email: 'bs.tranthib@hospital.com',
      password: 'Doctor@123',
      fullName: 'TS.BS Trần Thị Bích',
      phone: '0901111002',
      address: '456 Lê Lợi, Quận 3, TP.HCM',
    },
    doctor: {
      specialtyName: 'Nhi Tổng quát',
      subSpecialty: 'Nhi Hô hấp, Dị ứng miễn dịch Nhi',
      professionalTitle: 'Tiến sĩ, Bác sĩ',
      yearsOfExperience: 18,
      consultationFee: 400000,
      bio: 'TS.BS Trần Thị Bích là chuyên gia Nhi khoa với 18 năm kinh nghiệm chăm sóc sức khỏe trẻ em. Chuyên điều trị các bệnh lý hô hấp ở trẻ em như hen suyễn, viêm phổi, viêm phế quản và các vấn đề dị ứng. Bà nổi tiếng với sự tận tâm, nhẹ nhàng và khả năng giao tiếp tốt với trẻ nhỏ. Đã tham gia nhiều chương trình đào tạo quốc tế về Nhi khoa.',
    },
    educations: [
      { school: 'Đại học Y Hà Nội', degree: 'Bác sĩ Đa khoa', graduationYear: 2006 },
      { school: 'Đại học Y Hà Nội', degree: 'Bác sĩ Nội trú Nhi khoa', graduationYear: 2009 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Tiến sĩ Y học', graduationYear: 2015 },
    ],
    awards: [
      { title: 'Bác sĩ trẻ xuất sắc', organization: 'Hội Nhi khoa Việt Nam', year: 2012 },
      { title: 'Giải thưởng Nghiên cứu Nhi khoa', organization: 'Bệnh viện Nhi Trung ương', year: 2017 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-002345', issueDate: new Date('2006-08-20') },
      { certificateName: 'Chứng nhận chuyên khoa Nhi', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CKI-NHI-2009-156', issueDate: new Date('2009-07-15') },
      { certificateName: 'PALS Provider', issuingAuthority: 'American Heart Association', licenseNumber: 'AHA-PALS-2023-VN045', issueDate: new Date('2023-05-10'), expiryDate: new Date('2025-05-10') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'TUESDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'TUESDAY', startTime: '13:30', endTime: '16:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'THURSDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 15 },
      ],
    },
  },
  {
    user: {
      email: 'bs.levanc@hospital.com',
      password: 'Doctor@123',
      fullName: 'GS.TS.BS Lê Văn Cường',
      phone: '0901111003',
      address: '789 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
    },
    doctor: {
      specialtyName: 'Chấn thương - Chỉnh hình',
      subSpecialty: 'Phẫu thuật khớp gối, Phẫu thuật cột sống',
      professionalTitle: 'Giáo sư, Tiến sĩ, Bác sĩ',
      yearsOfExperience: 30,
      consultationFee: 600000,
      bio: 'GS.TS.BS Lê Văn Cường là chuyên gia hàng đầu Việt Nam về phẫu thuật Chấn thương Chỉnh hình với 30 năm kinh nghiệm. Ông là người tiên phong áp dụng kỹ thuật phẫu thuật nội soi khớp tại Việt Nam. Chuyên điều trị các bệnh lý về cơ xương khớp, chấn thương thể thao, thoái hóa khớp và các ca phẫu thuật thay khớp phức tạp. Đã đào tạo hàng trăm bác sĩ chuyên khoa Chấn thương Chỉnh hình.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 1994 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Thạc sĩ Ngoại khoa', graduationYear: 1998 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Tiến sĩ Y học', graduationYear: 2003 },
      { school: 'AO Foundation, Switzerland', degree: 'Fellowship Phẫu thuật Chấn thương', graduationYear: 2005 },
    ],
    awards: [
      { title: 'Thầy thuốc Nhân dân', organization: 'Nhà nước Việt Nam', year: 2020, description: 'Danh hiệu cao quý nhất dành cho thầy thuốc' },
      { title: 'Giải thưởng Hồ Chí Minh về Khoa học', organization: 'Nhà nước Việt Nam', year: 2015 },
      { title: 'Best Orthopedic Surgeon Award', organization: 'ASEAN Orthopedic Association', year: 2018 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-000567', issueDate: new Date('1994-09-01') },
      { certificateName: 'Chứng nhận Phẫu thuật viên Chỉnh hình', issuingAuthority: 'Hội Chấn thương Chỉnh hình Việt Nam', licenseNumber: 'CTCH-1998-023', issueDate: new Date('1998-12-10') },
      { certificateName: 'AO Trauma Fellowship', issuingAuthority: 'AO Foundation', licenseNumber: 'AOF-2005-VN001', issueDate: new Date('2005-08-30') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 10 },
        { dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 10 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 8 },
      ],
    },
  },
  {
    user: {
      email: 'bs.phamthid@hospital.com',
      password: 'Doctor@123',
      fullName: 'TS.BS Phạm Thị Dung',
      phone: '0901111004',
      address: '321 Cách Mạng Tháng 8, Quận 10, TP.HCM',
    },
    doctor: {
      specialtyName: 'Sản khoa',
      subSpecialty: 'Thai kỳ nguy cơ cao, Siêu âm thai',
      professionalTitle: 'Tiến sĩ, Bác sĩ',
      yearsOfExperience: 20,
      consultationFee: 450000,
      bio: 'TS.BS Phạm Thị Dung là chuyên gia Sản khoa với 20 năm kinh nghiệm chăm sóc sức khỏe thai phụ. Chuyên theo dõi và điều trị thai kỳ nguy cơ cao, siêu âm chẩn đoán trước sinh, và đỡ đẻ an toàn. Bà đã thực hiện hàng nghìn ca sinh thành công và được nhiều sản phụ tin tưởng. Luôn tận tâm đồng hành cùng các mẹ bầu trong suốt thai kỳ.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2004 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Nội trú Sản Phụ khoa', graduationYear: 2007 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Tiến sĩ Y học', graduationYear: 2014 },
    ],
    awards: [
      { title: 'Bác sĩ Sản khoa tiêu biểu', organization: 'Hội Sản Phụ khoa Việt Nam', year: 2019 },
      { title: 'Giải thưởng Nghiên cứu Sản khoa', organization: 'Bệnh viện Từ Dũ', year: 2016 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-003456', issueDate: new Date('2004-07-20') },
      { certificateName: 'Chứng nhận Siêu âm Sản khoa nâng cao', issuingAuthority: 'Hội Siêu âm Việt Nam', licenseNumber: 'SASK-2015-078', issueDate: new Date('2015-03-15') },
      { certificateName: 'Chứng nhận Thai kỳ nguy cơ cao', issuingAuthority: 'Bệnh viện Từ Dũ', licenseNumber: 'TKNCC-2018-034', issueDate: new Date('2018-09-20') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'WEDNESDAY', startTime: '13:30', endTime: '16:00', examinationType: 'ONLINE', maxPatients: 10 },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'FRIDAY', startTime: '13:30', endTime: '16:00', examinationType: 'IN_PERSON', maxPatients: 12 },
      ],
    },
  },
  {
    user: {
      email: 'bs.nguyenvane@hospital.com',
      password: 'Doctor@123',
      fullName: 'ThS.BS Nguyễn Văn Em',
      phone: '0901111005',
      address: '567 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
    },
    doctor: {
      specialtyName: 'Nội Tiêu hóa',
      subSpecialty: 'Nội soi tiêu hóa, Bệnh gan mật',
      professionalTitle: 'Thạc sĩ, Bác sĩ',
      yearsOfExperience: 12,
      consultationFee: 350000,
      bio: 'ThS.BS Nguyễn Văn Em là bác sĩ chuyên khoa Tiêu hóa với 12 năm kinh nghiệm. Chuyên nội soi dạ dày, đại tràng chẩn đoán và điều trị. Điều trị các bệnh lý về dạ dày, ruột, gan, mật như viêm loét dạ dày, trào ngược dạ dày thực quản, viêm gan, xơ gan, sỏi mật. Kỹ năng nội soi tiêu hóa xuất sắc với hàng nghìn ca nội soi thành công.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2012 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Thạc sĩ Nội khoa', graduationYear: 2016 },
      { school: 'Tokyo Medical University, Japan', degree: 'Khóa đào tạo Nội soi nâng cao', graduationYear: 2019 },
    ],
    awards: [
      { title: 'Bác sĩ trẻ tiêu biểu', organization: 'Hội Tiêu hóa Việt Nam', year: 2018 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-004567', issueDate: new Date('2012-08-15') },
      { certificateName: 'Chứng nhận Nội soi Tiêu hóa', issuingAuthority: 'Hội Nội soi Việt Nam', licenseNumber: 'NSTH-2016-123', issueDate: new Date('2016-11-20') },
      { certificateName: 'Advanced Endoscopy Certificate', issuingAuthority: 'Japan Gastroenterological Endoscopy Society', licenseNumber: 'JGES-2019-VN012', issueDate: new Date('2019-06-30') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 18 },
        { dayOfWeek: 'TUESDAY', startTime: '13:30', endTime: '17:00', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'WEDNESDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 18 },
        { dayOfWeek: 'THURSDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 18 },
        { dayOfWeek: 'FRIDAY', startTime: '13:30', endTime: '16:30', examinationType: 'ONLINE', maxPatients: 10 },
      ],
    },
  },
  {
    user: {
      email: 'bs.tranvanf@hospital.com',
      password: 'Doctor@123',
      fullName: 'BS.CKII Trần Văn Phúc',
      phone: '0901111006',
      address: '890 Hai Bà Trưng, Quận 1, TP.HCM',
    },
    doctor: {
      specialtyName: 'Da liễu Tổng quát',
      subSpecialty: 'Bệnh da mãn tính, Da liễu thẩm mỹ',
      professionalTitle: 'Bác sĩ Chuyên khoa II',
      yearsOfExperience: 15,
      consultationFee: 380000,
      bio: 'BS.CKII Trần Văn Phúc là bác sĩ Da liễu với 15 năm kinh nghiệm điều trị các bệnh về da. Chuyên điều trị mụn trứng cá, chàm, vảy nến, nấm da, và các bệnh da mãn tính. Có nhiều kinh nghiệm trong điều trị da liễu thẩm mỹ như trị nám, tàn nhang, trẻ hóa da. Tiếp cận điều trị toàn diện kết hợp Tây y và phương pháp hiện đại.',
    },
    educations: [
      { school: 'Đại học Y Hà Nội', degree: 'Bác sĩ Đa khoa', graduationYear: 2009 },
      { school: 'Đại học Y Hà Nội', degree: 'Bác sĩ Chuyên khoa I Da liễu', graduationYear: 2013 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Chuyên khoa II Da liễu', graduationYear: 2018 },
    ],
    awards: [
      { title: 'Giải thưởng Nghiên cứu Da liễu', organization: 'Hội Da liễu Việt Nam', year: 2020 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-005678', issueDate: new Date('2009-09-10') },
      { certificateName: 'Chứng nhận Da liễu Thẩm mỹ', issuingAuthority: 'Hội Da liễu Việt Nam', licenseNumber: 'DLTM-2019-067', issueDate: new Date('2019-04-15') },
      { certificateName: 'Laser & Light Therapy Certificate', issuingAuthority: 'American Academy of Dermatology', licenseNumber: 'AAD-LLT-2021-VN034', issueDate: new Date('2021-02-28'), expiryDate: new Date('2026-02-28') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '17:00', examinationType: 'IN_PERSON', maxPatients: 18 },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 15 },
      ],
    },
  },
  {
    user: {
      email: 'bs.lethig@hospital.com',
      password: 'Doctor@123',
      fullName: 'TS.BS Lê Thị Giang',
      phone: '0901111007',
      address: '234 Võ Văn Tần, Quận 3, TP.HCM',
    },
    doctor: {
      specialtyName: 'Thần kinh Tổng quát',
      subSpecialty: 'Đột quỵ não, Parkinson, Động kinh',
      professionalTitle: 'Tiến sĩ, Bác sĩ',
      yearsOfExperience: 16,
      consultationFee: 420000,
      bio: 'TS.BS Lê Thị Giang là chuyên gia Thần kinh học với 16 năm kinh nghiệm. Chuyên điều trị đột quỵ não, bệnh Parkinson, động kinh, đau đầu mãn tính, chóng mặt và các rối loạn thần kinh. Có nhiều kinh nghiệm trong điều trị phục hồi chức năng sau đột quỵ. Tham gia nhiều nghiên cứu về bệnh thoái hóa thần kinh.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2008 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Nội trú Thần kinh', graduationYear: 2011 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Tiến sĩ Y học', graduationYear: 2018 },
      { school: 'Johns Hopkins University', degree: 'Khóa đào tạo Đột quỵ nâng cao', graduationYear: 2020 },
    ],
    awards: [
      { title: 'Giải thưởng Nghiên cứu Đột quỵ', organization: 'Hội Đột quỵ Việt Nam', year: 2021 },
      { title: 'Bác sĩ Thần kinh xuất sắc', organization: 'Hội Thần kinh học Việt Nam', year: 2019 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-006789', issueDate: new Date('2008-08-20') },
      { certificateName: 'Chứng nhận Điều trị Đột quỵ', issuingAuthority: 'Hội Đột quỵ Việt Nam', licenseNumber: 'DTDQ-2020-045', issueDate: new Date('2020-10-15') },
      { certificateName: 'Stroke Unit Management Certificate', issuingAuthority: 'World Stroke Organization', licenseNumber: 'WSO-SUM-2021-VN008', issueDate: new Date('2021-03-20') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'TUESDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'TUESDAY', startTime: '13:30', endTime: '16:30', examinationType: 'IN_PERSON', maxPatients: 10 },
        { dayOfWeek: 'THURSDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 10 },
      ],
    },
  },
  {
    user: {
      email: 'bs.phamvanh@hospital.com',
      password: 'Doctor@123',
      fullName: 'ThS.BS Phạm Văn Hải',
      phone: '0901111008',
      address: '456 Trần Hưng Đạo, Quận 5, TP.HCM',
    },
    doctor: {
      specialtyName: 'Tai Mũi Họng Người lớn',
      subSpecialty: 'Viêm xoang, Viêm amidan, Ung thư vòm họng',
      professionalTitle: 'Thạc sĩ, Bác sĩ',
      yearsOfExperience: 14,
      consultationFee: 320000,
      bio: 'ThS.BS Phạm Văn Hải là bác sĩ Tai Mũi Họng với 14 năm kinh nghiệm. Chuyên điều trị các bệnh về tai, mũi, họng như viêm xoang, viêm amidan, viêm tai giữa, điếc, ù tai, polyp mũi. Có kinh nghiệm phẫu thuật nội soi xoang, cắt amidan, và tầm soát ung thư vòm họng. Tiếp cận điều trị nhẹ nhàng, hiệu quả.',
    },
    educations: [
      { school: 'Đại học Y Dược Cần Thơ', degree: 'Bác sĩ Đa khoa', graduationYear: 2010 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Thạc sĩ Tai Mũi Họng', graduationYear: 2014 },
      { school: 'Seoul National University Hospital, Korea', degree: 'Khóa đào tạo Nội soi TMH', graduationYear: 2017 },
    ],
    awards: [
      { title: 'Bác sĩ TMH tiêu biểu', organization: 'Hội Tai Mũi Họng Việt Nam', year: 2022 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-007890', issueDate: new Date('2010-09-15') },
      { certificateName: 'Chứng nhận Nội soi Tai Mũi Họng', issuingAuthority: 'Hội Tai Mũi Họng Việt Nam', licenseNumber: 'NSTMH-2017-089', issueDate: new Date('2017-08-30') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 25 },
        { dayOfWeek: 'MONDAY', startTime: '13:30', endTime: '17:00', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'WEDNESDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 25 },
        { dayOfWeek: 'FRIDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 25 },
        { dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '16:00', examinationType: 'ONLINE', maxPatients: 10 },
      ],
    },
  },
  {
    user: {
      email: 'bs.nguyenthii@hospital.com',
      password: 'Doctor@123',
      fullName: 'BS.CKI Nguyễn Thị Lan',
      phone: '0901111009',
      address: '678 Lý Thường Kiệt, Quận 10, TP.HCM',
    },
    doctor: {
      specialtyName: 'Nhãn khoa Tổng quát',
      subSpecialty: 'Cận thị, Viễn thị, Đục thủy tinh thể',
      professionalTitle: 'Bác sĩ Chuyên khoa I',
      yearsOfExperience: 10,
      consultationFee: 300000,
      bio: 'BS.CKI Nguyễn Thị Lan là bác sĩ Nhãn khoa với 10 năm kinh nghiệm chăm sóc mắt. Chuyên khám và điều trị các bệnh về mắt như cận thị, viễn thị, loạn thị, đục thủy tinh thể, tăng nhãn áp, các bệnh về võng mạc. Có kinh nghiệm phẫu thuật thay thủy tinh thể và điều trị laser mắt. Tận tâm và cẩn thận trong từng ca khám.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2014 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Chuyên khoa I Nhãn khoa', graduationYear: 2018 },
      { school: 'Singapore National Eye Centre', degree: 'Khóa đào tạo Phẫu thuật Đục TTT', graduationYear: 2021 },
    ],
    awards: [],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-008901', issueDate: new Date('2014-08-20') },
      { certificateName: 'Chứng nhận Phẫu thuật Phaco', issuingAuthority: 'Hội Nhãn khoa Việt Nam', licenseNumber: 'PTPHACO-2021-056', issueDate: new Date('2021-05-15') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'THURSDAY', startTime: '13:30', endTime: '16:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 15 },
      ],
    },
  },
  {
    user: {
      email: 'bs.tranvanj@hospital.com',
      password: 'Doctor@123',
      fullName: 'PGS.TS.BS Trần Văn Khoa',
      phone: '0901111010',
      address: '901 Nam Kỳ Khởi Nghĩa, Quận 3, TP.HCM',
    },
    doctor: {
      specialtyName: 'Nội Hô hấp',
      subSpecialty: 'Hen suyễn, COPD, Ung thư phổi',
      professionalTitle: 'Phó Giáo sư, Tiến sĩ, Bác sĩ',
      yearsOfExperience: 22,
      consultationFee: 480000,
      bio: 'PGS.TS.BS Trần Văn Khoa là chuyên gia hàng đầu về Hô hấp với 22 năm kinh nghiệm. Chuyên điều trị các bệnh phổi như hen suyễn, COPD, viêm phổi, lao phổi, ung thư phổi và các bệnh lý hô hấp phức tạp. Có nhiều công trình nghiên cứu về bệnh phổi tắc nghẽn mãn tính được công bố quốc tế. Là giảng viên đại học và đào tạo nhiều thế hệ bác sĩ Hô hấp.',
    },
    educations: [
      { school: 'Đại học Y Hà Nội', degree: 'Bác sĩ Đa khoa', graduationYear: 2002 },
      { school: 'Đại học Y Hà Nội', degree: 'Thạc sĩ Nội khoa', graduationYear: 2006 },
      { school: 'Đại học Y Hà Nội', degree: 'Tiến sĩ Y học', graduationYear: 2011 },
      { school: 'Royal Brompton Hospital, UK', degree: 'Fellowship Hô hấp', graduationYear: 2014 },
    ],
    awards: [
      { title: 'Thầy thuốc Ưu tú', organization: 'Bộ Y tế Việt Nam', year: 2021 },
      { title: 'Giải thưởng Nghiên cứu Hô hấp xuất sắc', organization: 'Hội Hô hấp Việt Nam', year: 2018 },
      { title: 'Best Abstract Award', organization: 'European Respiratory Society', year: 2016 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-009012', issueDate: new Date('2002-09-01') },
      { certificateName: 'Chứng nhận Nội soi Phế quản', issuingAuthority: 'Hội Hô hấp Việt Nam', licenseNumber: 'NSPQ-2014-034', issueDate: new Date('2014-12-20') },
      { certificateName: 'GOLD COPD Educator Certificate', issuingAuthority: 'Global Initiative for Chronic Obstructive Lung Disease', licenseNumber: 'GOLD-EDU-2022-VN005', issueDate: new Date('2022-01-15'), expiryDate: new Date('2027-01-15') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'THURSDAY', startTime: '14:00', endTime: '16:00', examinationType: 'ONLINE', maxPatients: 8 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 10 },
      ],
    },
  },
  {
    user: {
      email: 'bs.hoangvank@hospital.com',
      password: 'Doctor@123',
      fullName: 'TS.BS Hoàng Văn Khánh',
      phone: '0901111011',
      address: '111 Pasteur, Quận 1, TP.HCM',
    },
    doctor: {
      specialtyName: 'Nội Thận - Tiết niệu',
      subSpecialty: 'Lọc máu, Ghép thận, Sỏi thận',
      professionalTitle: 'Tiến sĩ, Bác sĩ',
      yearsOfExperience: 17,
      consultationFee: 400000,
      bio: 'TS.BS Hoàng Văn Khánh là chuyên gia Thận học với 17 năm kinh nghiệm. Chuyên điều trị các bệnh lý về thận như suy thận cấp và mãn, viêm cầu thận, sỏi thận, nhiễm trùng đường tiết niệu. Có nhiều kinh nghiệm trong lọc máu chu kỳ và chăm sóc bệnh nhân ghép thận. Tham gia nhiều nghiên cứu về bệnh thận mãn tính.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2007 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Thạc sĩ Nội khoa', graduationYear: 2011 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Tiến sĩ Y học', graduationYear: 2017 },
    ],
    awards: [
      { title: 'Giải thưởng Nghiên cứu Thận học', organization: 'Hội Thận học Việt Nam', year: 2020 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-010123', issueDate: new Date('2007-08-15') },
      { certificateName: 'Chứng nhận Lọc máu', issuingAuthority: 'Hội Thận học Việt Nam', licenseNumber: 'LM-2015-067', issueDate: new Date('2015-05-20') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '16:00', examinationType: 'ONLINE', maxPatients: 8 },
      ],
    },
  },
  {
    user: {
      email: 'bs.nguyenthil@hospital.com',
      password: 'Doctor@123',
      fullName: 'PGS.TS.BS Nguyễn Thị Linh',
      phone: '0901111012',
      address: '222 Nguyễn Đình Chiểu, Quận 3, TP.HCM',
    },
    doctor: {
      specialtyName: 'Nội Tiết',
      subSpecialty: 'Đái tháo đường, Tuyến giáp, Rối loạn chuyển hóa',
      professionalTitle: 'Phó Giáo sư, Tiến sĩ, Bác sĩ',
      yearsOfExperience: 20,
      consultationFee: 450000,
      bio: 'PGS.TS.BS Nguyễn Thị Linh là chuyên gia Nội tiết với 20 năm kinh nghiệm. Chuyên điều trị đái tháo đường type 1 và type 2, các bệnh lý tuyến giáp (cường giáp, suy giáp, bướu giáp), rối loạn lipid máu, béo phì và các rối loạn chuyển hóa. Là tác giả nhiều công trình nghiên cứu về đái tháo đường tại Việt Nam.',
    },
    educations: [
      { school: 'Đại học Y Hà Nội', degree: 'Bác sĩ Đa khoa', graduationYear: 2004 },
      { school: 'Đại học Y Hà Nội', degree: 'Tiến sĩ Y học', graduationYear: 2012 },
      { school: 'Joslin Diabetes Center, USA', degree: 'Fellowship Đái tháo đường', graduationYear: 2015 },
    ],
    awards: [
      { title: 'Thầy thuốc Ưu tú', organization: 'Bộ Y tế Việt Nam', year: 2022 },
      { title: 'Giải thưởng Nghiên cứu Nội tiết xuất sắc', organization: 'Hội Nội tiết Việt Nam', year: 2019 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-011234', issueDate: new Date('2004-09-10') },
      { certificateName: 'Certified Diabetes Educator', issuingAuthority: 'International Diabetes Federation', licenseNumber: 'IDF-CDE-2018-VN023', issueDate: new Date('2018-06-15'), expiryDate: new Date('2028-06-15') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'TUESDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 18 },
        { dayOfWeek: 'TUESDAY', startTime: '13:30', endTime: '16:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'THURSDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 18 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 12 },
      ],
    },
  },
  {
    user: {
      email: 'bs.levam@hospital.com',
      password: 'Doctor@123',
      fullName: 'TS.BS Lê Văn Minh',
      phone: '0901111013',
      address: '333 Cộng Hòa, Quận Tân Bình, TP.HCM',
    },
    doctor: {
      specialtyName: 'Huyết học',
      subSpecialty: 'Thiếu máu, Ung thư máu, Rối loạn đông máu',
      professionalTitle: 'Tiến sĩ, Bác sĩ',
      yearsOfExperience: 15,
      consultationFee: 420000,
      bio: 'TS.BS Lê Văn Minh là chuyên gia Huyết học với 15 năm kinh nghiệm. Chuyên chẩn đoán và điều trị các bệnh về máu như thiếu máu, bạch cầu cấp và mãn, u lympho, đa u tủy xương, rối loạn đông máu và các bệnh lý huyết học khác. Có kinh nghiệm trong ghép tủy xương và điều trị hóa chất.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2009 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Nội trú Huyết học', graduationYear: 2012 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Tiến sĩ Y học', graduationYear: 2019 },
    ],
    awards: [
      { title: 'Bác sĩ trẻ xuất sắc', organization: 'Hội Huyết học Việt Nam', year: 2016 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-012345', issueDate: new Date('2009-08-20') },
      { certificateName: 'Chứng nhận Huyết học lâm sàng', issuingAuthority: 'Hội Huyết học Việt Nam', licenseNumber: 'HHLS-2015-089', issueDate: new Date('2015-11-10') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '16:00', examinationType: 'ONLINE', maxPatients: 6 },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 12 },
      ],
    },
  },
  {
    user: {
      email: 'bs.phamvann@hospital.com',
      password: 'Doctor@123',
      fullName: 'GS.TS.BS Phạm Văn Nam',
      phone: '0901111014',
      address: '444 Đinh Tiên Hoàng, Quận Bình Thạnh, TP.HCM',
    },
    doctor: {
      specialtyName: 'Ngoại Tổng hợp',
      subSpecialty: 'Phẫu thuật ổ bụng, Phẫu thuật nội soi',
      professionalTitle: 'Giáo sư, Tiến sĩ, Bác sĩ',
      yearsOfExperience: 28,
      consultationFee: 550000,
      bio: 'GS.TS.BS Phạm Văn Nam là chuyên gia Ngoại khoa hàng đầu với 28 năm kinh nghiệm phẫu thuật. Chuyên phẫu thuật tổng quát các bệnh lý vùng bụng, ngực. Là người tiên phong áp dụng phẫu thuật nội soi tại Việt Nam. Đã thực hiện hàng nghìn ca phẫu thuật thành công và đào tạo nhiều thế hệ phẫu thuật viên.',
    },
    educations: [
      { school: 'Đại học Y Hà Nội', degree: 'Bác sĩ Đa khoa', graduationYear: 1996 },
      { school: 'Đại học Y Hà Nội', degree: 'Tiến sĩ Y học', graduationYear: 2004 },
      { school: 'Cleveland Clinic, USA', degree: 'Fellowship Phẫu thuật nội soi', graduationYear: 2007 },
    ],
    awards: [
      { title: 'Thầy thuốc Nhân dân', organization: 'Nhà nước Việt Nam', year: 2018 },
      { title: 'Giải thưởng Hồ Chí Minh về Y học', organization: 'Nhà nước Việt Nam', year: 2020 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-013456', issueDate: new Date('1996-09-01') },
      { certificateName: 'Chứng nhận Phẫu thuật viên Ngoại khoa', issuingAuthority: 'Hội Ngoại khoa Việt Nam', licenseNumber: 'PTVNK-2000-012', issueDate: new Date('2000-06-15') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 10 },
        { dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 10 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 8 },
      ],
    },
  },
  {
    user: {
      email: 'bs.nguyenvano@hospital.com',
      password: 'Doctor@123',
      fullName: 'ThS.BS Nguyễn Văn Oanh',
      phone: '0901111015',
      address: '555 Trường Chinh, Quận Tân Phú, TP.HCM',
    },
    doctor: {
      specialtyName: 'Ngoại Tiêu hóa',
      subSpecialty: 'Phẫu thuật gan mật, Phẫu thuật đại trực tràng',
      professionalTitle: 'Thạc sĩ, Bác sĩ',
      yearsOfExperience: 13,
      consultationFee: 380000,
      bio: 'ThS.BS Nguyễn Văn Oanh là bác sĩ Ngoại Tiêu hóa với 13 năm kinh nghiệm. Chuyên phẫu thuật các bệnh lý đường tiêu hóa như cắt ruột thừa, cắt túi mật, phẫu thuật sỏi mật, phẫu thuật dạ dày, phẫu thuật đại trực tràng. Thành thạo kỹ thuật phẫu thuật nội soi với hàng nghìn ca thành công.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2011 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Thạc sĩ Ngoại khoa', graduationYear: 2015 },
      { school: 'National University Hospital Singapore', degree: 'Khóa đào tạo Phẫu thuật nội soi nâng cao', graduationYear: 2018 },
    ],
    awards: [],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-014567', issueDate: new Date('2011-08-15') },
      { certificateName: 'Chứng nhận Phẫu thuật nội soi Tiêu hóa', issuingAuthority: 'Hội Nội soi Việt Nam', licenseNumber: 'PTNSTH-2018-056', issueDate: new Date('2018-09-20') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'TUESDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'TUESDAY', startTime: '13:30', endTime: '16:30', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'THURSDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 10 },
      ],
    },
  },
  {
    user: {
      email: 'bs.tranthip@hospital.com',
      password: 'Doctor@123',
      fullName: 'BS.CKII Trần Thị Phương',
      phone: '0901111016',
      address: '666 Lê Văn Sỹ, Quận 3, TP.HCM',
    },
    doctor: {
      specialtyName: 'Ngoại Tiết niệu',
      subSpecialty: 'Sỏi tiết niệu, U tuyến tiền liệt, Phẫu thuật nội soi',
      professionalTitle: 'Bác sĩ Chuyên khoa II',
      yearsOfExperience: 16,
      consultationFee: 400000,
      bio: 'BS.CKII Trần Thị Phương là bác sĩ Ngoại Tiết niệu với 16 năm kinh nghiệm. Chuyên điều trị các bệnh lý tiết niệu như sỏi thận, sỏi niệu quản, u tuyến tiền liệt, ung thư bàng quang, hẹp niệu đạo. Thành thạo các kỹ thuật tán sỏi ngoài cơ thể, nội soi tán sỏi và phẫu thuật nội soi tiết niệu.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2008 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Chuyên khoa I Ngoại Tiết niệu', graduationYear: 2012 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Chuyên khoa II Ngoại Tiết niệu', graduationYear: 2018 },
    ],
    awards: [
      { title: 'Giải thưởng Phẫu thuật viên trẻ', organization: 'Hội Tiết niệu Việt Nam', year: 2015 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-015678', issueDate: new Date('2008-09-10') },
      { certificateName: 'Chứng nhận Tán sỏi ngoài cơ thể', issuingAuthority: 'Hội Tiết niệu Việt Nam', licenseNumber: 'TSNCT-2016-034', issueDate: new Date('2016-04-15') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '16:00', examinationType: 'ONLINE', maxPatients: 8 },
      ],
    },
  },
  {
    user: {
      email: 'bs.levanq@hospital.com',
      password: 'Doctor@123',
      fullName: 'TS.BS Lê Văn Quang',
      phone: '0901111017',
      address: '777 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    },
    doctor: {
      specialtyName: 'Nhi Sơ sinh',
      subSpecialty: 'Hồi sức sơ sinh, Sinh non, Dị tật bẩm sinh',
      professionalTitle: 'Tiến sĩ, Bác sĩ',
      yearsOfExperience: 14,
      consultationFee: 420000,
      bio: 'TS.BS Lê Văn Quang là chuyên gia Nhi Sơ sinh với 14 năm kinh nghiệm chăm sóc trẻ sơ sinh. Chuyên điều trị các bệnh lý sơ sinh như sinh non, suy hô hấp sơ sinh, vàng da sơ sinh, nhiễm trùng sơ sinh, dị tật bẩm sinh. Có nhiều kinh nghiệm trong hồi sức cấp cứu sơ sinh và nuôi dưỡng trẻ sinh non.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2010 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Nội trú Nhi khoa', graduationYear: 2013 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Tiến sĩ Y học', graduationYear: 2020 },
    ],
    awards: [
      { title: 'Bác sĩ Nhi khoa tiêu biểu', organization: 'Bệnh viện Nhi Đồng 1', year: 2021 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-016789', issueDate: new Date('2010-08-20') },
      { certificateName: 'NRP Provider', issuingAuthority: 'American Academy of Pediatrics', licenseNumber: 'AAP-NRP-2022-VN067', issueDate: new Date('2022-03-15'), expiryDate: new Date('2024-03-15') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'TUESDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'THURSDAY', startTime: '07:30', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 12 },
      ],
    },
  },
  {
    user: {
      email: 'bs.nguyenthir@hospital.com',
      password: 'Doctor@123',
      fullName: 'ThS.BS Nguyễn Thị Ry',
      phone: '0901111018',
      address: '888 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM',
    },
    doctor: {
      specialtyName: 'Phụ khoa',
      subSpecialty: 'U xơ tử cung, Nội soi phụ khoa, Vô sinh',
      professionalTitle: 'Thạc sĩ, Bác sĩ',
      yearsOfExperience: 12,
      consultationFee: 350000,
      bio: 'ThS.BS Nguyễn Thị Ry là bác sĩ Phụ khoa với 12 năm kinh nghiệm chăm sóc sức khỏe phụ nữ. Chuyên điều trị các bệnh phụ khoa như u xơ tử cung, u nang buồng trứng, viêm nhiễm phụ khoa, rối loạn kinh nguyệt, tiền mãn kinh và điều trị vô sinh. Thành thạo phẫu thuật nội soi phụ khoa.',
    },
    educations: [
      { school: 'Đại học Y Dược Cần Thơ', degree: 'Bác sĩ Đa khoa', graduationYear: 2012 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Thạc sĩ Sản Phụ khoa', graduationYear: 2016 },
      { school: 'Bệnh viện Từ Dũ', degree: 'Khóa đào tạo Nội soi Phụ khoa', graduationYear: 2019 },
    ],
    awards: [],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-017890', issueDate: new Date('2012-09-15') },
      { certificateName: 'Chứng nhận Nội soi Phụ khoa', issuingAuthority: 'Hội Sản Phụ khoa Việt Nam', licenseNumber: 'NSPK-2019-078', issueDate: new Date('2019-07-20') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 18 },
        { dayOfWeek: 'TUESDAY', startTime: '13:30', endTime: '16:30', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 18 },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 18 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 12 },
      ],
    },
  },
  {
    user: {
      email: 'bs.tranvans@hospital.com',
      password: 'Doctor@123',
      fullName: 'BS.CKI Trần Văn Sơn',
      phone: '0901111019',
      address: '999 Phan Đăng Lưu, Quận Phú Nhuận, TP.HCM',
    },
    doctor: {
      specialtyName: 'Tai Mũi Họng Nhi',
      subSpecialty: 'Viêm VA, Viêm amidan ở trẻ, Viêm tai giữa',
      professionalTitle: 'Bác sĩ Chuyên khoa I',
      yearsOfExperience: 11,
      consultationFee: 320000,
      bio: 'BS.CKI Trần Văn Sơn là bác sĩ Tai Mũi Họng Nhi với 11 năm kinh nghiệm. Chuyên khám và điều trị các bệnh TMH ở trẻ em như viêm VA, viêm amidan, viêm tai giữa, viêm xoang ở trẻ, ngủ ngáy và ngưng thở khi ngủ ở trẻ. Tiếp cận điều trị nhẹ nhàng, thân thiện với trẻ nhỏ.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2013 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Chuyên khoa I Tai Mũi Họng', graduationYear: 2017 },
    ],
    awards: [],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-018901', issueDate: new Date('2013-08-20') },
      { certificateName: 'Chứng nhận TMH Nhi khoa', issuingAuthority: 'Hội Tai Mũi Họng Việt Nam', licenseNumber: 'TMHNK-2020-045', issueDate: new Date('2020-05-10') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'WEDNESDAY', startTime: '13:30', endTime: '16:00', examinationType: 'ONLINE', maxPatients: 10 },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 20 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 15 },
      ],
    },
  },
  {
    user: {
      email: 'bs.phamthit@hospital.com',
      password: 'Doctor@123',
      fullName: 'TS.BS Phạm Thị Tuyết',
      phone: '0901111020',
      address: '100 Nguyễn Trãi, Quận 5, TP.HCM',
    },
    doctor: {
      specialtyName: 'Phẫu thuật Khúc xạ',
      subSpecialty: 'LASIK, SMILE, ICL',
      professionalTitle: 'Tiến sĩ, Bác sĩ',
      yearsOfExperience: 15,
      consultationFee: 450000,
      bio: 'TS.BS Phạm Thị Tuyết là chuyên gia Phẫu thuật Khúc xạ với 15 năm kinh nghiệm. Chuyên phẫu thuật điều trị tật khúc xạ như cận thị, viễn thị, loạn thị bằng các phương pháp hiện đại nhất như LASIK, SMILE, PRK và cấy kính nội nhãn ICL. Đã thực hiện hơn 10,000 ca phẫu thuật khúc xạ thành công.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2009 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Thạc sĩ Nhãn khoa', graduationYear: 2013 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Tiến sĩ Y học', graduationYear: 2019 },
      { school: 'Moorfields Eye Hospital, UK', degree: 'Fellowship Phẫu thuật Khúc xạ', graduationYear: 2016 },
    ],
    awards: [
      { title: 'Best Refractive Surgeon Award', organization: 'APAO (Asia-Pacific Academy of Ophthalmology)', year: 2021 },
      { title: 'Giải thưởng Bác sĩ Nhãn khoa xuất sắc', organization: 'Hội Nhãn khoa Việt Nam', year: 2020 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-019012', issueDate: new Date('2009-09-10') },
      { certificateName: 'SMILE Surgery Certificate', issuingAuthority: 'Carl Zeiss Meditec', licenseNumber: 'CZM-SMILE-2018-VN012', issueDate: new Date('2018-06-20') },
      { certificateName: 'ICL Certified Surgeon', issuingAuthority: 'STAAR Surgical', licenseNumber: 'STAAR-ICL-2019-VN008', issueDate: new Date('2019-03-15') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '11:30', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'THURSDAY', startTime: '14:00', endTime: '16:00', examinationType: 'ONLINE', maxPatients: 8 },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 10 },
      ],
    },
  },
  {
    user: {
      email: 'bs.nguyenvanu@hospital.com',
      password: 'Doctor@123',
      fullName: 'ThS.BS Nguyễn Văn Uy',
      phone: '0901111021',
      address: '200 Võ Thị Sáu, Quận 3, TP.HCM',
    },
    doctor: {
      specialtyName: 'Thẩm mỹ Da',
      subSpecialty: 'Trẻ hóa da, Trị nám, Laser thẩm mỹ',
      professionalTitle: 'Thạc sĩ, Bác sĩ',
      yearsOfExperience: 10,
      consultationFee: 400000,
      bio: 'ThS.BS Nguyễn Văn Uy là bác sĩ Da liễu Thẩm mỹ với 10 năm kinh nghiệm. Chuyên điều trị thẩm mỹ da như trị nám, tàn nhang, trẻ hóa da, xóa nếp nhăn, điều trị sẹo rỗ, căng da mặt không phẫu thuật. Sử dụng các công nghệ laser và ánh sáng tiên tiến nhất. Được đào tạo bài bản về thẩm mỹ nội khoa tại Hàn Quốc.',
    },
    educations: [
      { school: 'Đại học Y Dược TP.HCM', degree: 'Bác sĩ Đa khoa', graduationYear: 2014 },
      { school: 'Đại học Y Dược TP.HCM', degree: 'Thạc sĩ Da liễu', graduationYear: 2018 },
      { school: 'Yonsei University, Korea', degree: 'Khóa đào tạo Thẩm mỹ Da nâng cao', graduationYear: 2020 },
    ],
    awards: [
      { title: 'Bác sĩ Thẩm mỹ được yêu thích', organization: 'Tạp chí Sức khỏe & Đời sống', year: 2022 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-020123', issueDate: new Date('2014-08-15') },
      { certificateName: 'Botox & Filler Certification', issuingAuthority: 'Allergan Academy', licenseNumber: 'AA-BF-2019-VN089', issueDate: new Date('2019-09-10'), expiryDate: new Date('2029-09-10') },
      { certificateName: 'Advanced Laser Certificate', issuingAuthority: 'International Society of Dermatology', licenseNumber: 'ISD-ALC-2021-VN034', issueDate: new Date('2021-04-20') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '12:00', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '18:00', examinationType: 'IN_PERSON', maxPatients: 12 },
        { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '12:00', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '12:00', examinationType: 'IN_PERSON', maxPatients: 15 },
        { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '12:00', examinationType: 'IN_PERSON', maxPatients: 12 },
      ],
    },
  },
  {
    user: {
      email: 'bs.levanv@hospital.com',
      password: 'Doctor@123',
      fullName: 'PGS.TS.BS Lê Văn Việt',
      phone: '0901111022',
      address: '300 Nguyễn Thị Minh Khai, Quận 1, TP.HCM',
    },
    doctor: {
      specialtyName: 'Tim mạch Can thiệp',
      subSpecialty: 'Can thiệp mạch vành, Đặt stent, Thông tim',
      professionalTitle: 'Phó Giáo sư, Tiến sĩ, Bác sĩ',
      yearsOfExperience: 23,
      consultationFee: 550000,
      bio: 'PGS.TS.BS Lê Văn Việt là chuyên gia hàng đầu về Tim mạch Can thiệp với 23 năm kinh nghiệm. Chuyên thực hiện các thủ thuật can thiệp tim mạch như nong và đặt stent mạch vành, thông tim chẩn đoán, đặt máy tạo nhịp tim, can thiệp bệnh van tim qua da. Đã thực hiện hơn 8000 ca can thiệp mạch vành thành công.',
    },
    educations: [
      { school: 'Đại học Y Hà Nội', degree: 'Bác sĩ Đa khoa', graduationYear: 2001 },
      { school: 'Đại học Y Hà Nội', degree: 'Tiến sĩ Y học', graduationYear: 2009 },
      { school: 'Texas Heart Institute, USA', degree: 'Fellowship Tim mạch Can thiệp', graduationYear: 2012 },
    ],
    awards: [
      { title: 'Thầy thuốc Ưu tú', organization: 'Bộ Y tế Việt Nam', year: 2019 },
      { title: 'Best Interventional Cardiologist Award', organization: 'APSIC (Asia Pacific Society of Interventional Cardiology)', year: 2021 },
      { title: 'Giải thưởng Nghiên cứu Tim mạch xuất sắc', organization: 'Hội Tim mạch Việt Nam', year: 2018 },
    ],
    certifications: [
      { certificateName: 'Chứng chỉ hành nghề Bác sĩ', issuingAuthority: 'Bộ Y tế Việt Nam', licenseNumber: 'CCHN-021234', issueDate: new Date('2001-09-01') },
      { certificateName: 'Board Certified Interventional Cardiologist', issuingAuthority: 'American Board of Internal Medicine', licenseNumber: 'ABIM-IC-2015-VN003', issueDate: new Date('2015-06-20'), expiryDate: new Date('2025-06-20') },
      { certificateName: 'TAVI Proctor Certificate', issuingAuthority: 'Edwards Lifesciences', licenseNumber: 'EL-TAVI-2020-VN001', issueDate: new Date('2020-02-15') },
    ],
    schedule: {
      timeSlots: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 10 },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 10 },
        { dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '16:00', examinationType: 'ONLINE', maxPatients: 6 },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '11:00', examinationType: 'IN_PERSON', maxPatients: 10 },
      ],
    },
  },
];

export async function seedDoctors(prisma: PrismaClient) {
  console.log('👨‍⚕️ Seeding doctors...');

  const specialties = await prisma.specialty.findMany();
  const specialtyMap = new Map(specialties.map((s) => [s.name, s.id]));

  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  for (const doctorData of doctors) {
    const specialtyId = specialtyMap.get(doctorData.doctor.specialtyName);
    if (!specialtyId) {
      console.warn(`⚠️ Specialty not found: ${doctorData.doctor.specialtyName}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(doctorData.user.password, SALT_ROUNDS);

    const existingUser = await prisma.user.findUnique({
      where: { email: doctorData.user.email },
    });

    if (existingUser) {
      console.log(`   ℹ️ Doctor already exists: ${doctorData.user.fullName}`);
      continue;
    }

    await prisma.user.create({
      data: {
        email: doctorData.user.email,
        password: hashedPassword,
        fullName: doctorData.user.fullName,
        phone: doctorData.user.phone,
        address: doctorData.user.address,
        role: 'DOCTOR',
        isActive: true,
        doctor: {
          create: {
            primarySpecialtyId: specialtyId,
            subSpecialty: doctorData.doctor.subSpecialty,
            professionalTitle: doctorData.doctor.professionalTitle,
            yearsOfExperience: doctorData.doctor.yearsOfExperience,
            consultationFee: doctorData.doctor.consultationFee,
            bio: doctorData.doctor.bio,
            status: 'ACTIVE',
            educations: {
              create: doctorData.educations,
            },
            awards: {
              create: doctorData.awards,
            },
            certifications: {
              create: doctorData.certifications,
            },
            schedules: {
              create: {
                startDate,
                endDate,
                isActive: true,
                timeSlots: {
                  create: doctorData.schedule.timeSlots,
                },
              },
            },
          },
        },
      },
    });

    console.log(`   ✅ Created doctor: ${doctorData.user.fullName}`);
  }

  console.log(`✅ Seeded ${doctors.length} doctors with full details`);
}

export { doctors };


import 'dotenv/config';
import { PrismaClient, Role, DeliveryStatus, ParcelStatus, SlotStatus, VerificationMethod, NotificationType, NotificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting CampusDrop database seed...');

  // Clean existing tables in reverse relational order
  await prisma.auditLog.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pickupToken.deleteMany();
  await prisma.otpToken.deleteMany();
  await prisma.pickup.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.storageSlot.deleteMany();
  await prisma.storageRack.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.deliveryPartner.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.guard.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  const passwordHash = await bcrypt.hash('CampusDrop@2026', 10);

  // 1. Create System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'CAMPUS_NAME', value: 'Rishihood University (Main Gate Hub)', description: 'University name' },
      { key: 'TOTAL_STUDENTS_CAPACITY', value: '2300', description: 'Enrolled students capacity' },
      { key: 'STORAGE_RETENTION_HOURS', value: '72', description: 'Max hours parcel kept before escalation' },
      { key: 'QR_EXPIRY_MINUTES', value: '15', description: 'Single-use QR code validity period' },
      { key: 'OTP_EXPIRY_MINUTES', value: '10', description: 'Single-use OTP validity period' },
    ]
  });

  // 2. Create Delivery Partners (Logistics only)
  const deliveryPartners = await Promise.all([
    prisma.deliveryPartner.create({
      data: { name: 'Amazon', slug: 'amazon', color: '#FF9900', logoUrl: '' }
    }),
    prisma.deliveryPartner.create({
      data: { name: 'Flipkart', slug: 'flipkart', color: '#2874F0', logoUrl: '' }
    }),
    prisma.deliveryPartner.create({
      data: { name: 'Delhivery', slug: 'delhivery', color: '#B30B00', logoUrl: '' }
    }),
    prisma.deliveryPartner.create({
      data: { name: 'Blue Dart', slug: 'bluedart', color: '#003399', logoUrl: '' }
    }),
    prisma.deliveryPartner.create({
      data: { name: 'DTDC', slug: 'dtdc', color: '#ED1C24', logoUrl: '' }
    }),
    prisma.deliveryPartner.create({
      data: { name: 'Ecom Express', slug: 'ecomexpress', color: '#1B4D3E', logoUrl: '' }
    }),
    prisma.deliveryPartner.create({
      data: { name: 'India Post', slug: 'indiapost', color: '#CC0000', logoUrl: '' }
    }),
    prisma.deliveryPartner.create({
      data: { name: 'Other', slug: 'other', color: '#667085', logoUrl: '' }
    }),
  ]);

  const partnerMap = new Map(deliveryPartners.map(p => [p.slug, p]));

  // 3. Create Storage Racks & Slots (Racks A, B, C with 10 slots each, capacity 5 parcels/slot)
  console.log('Creating Storage Racks (A, B, C) and slots...');
  const racks = await Promise.all([
    prisma.storageRack.create({ data: { name: 'Rack A', code: 'A', zone: 'North Shelf', capacity: 50 } }),
    prisma.storageRack.create({ data: { name: 'Rack B', code: 'B', zone: 'Center Shelf', capacity: 50 } }),
    prisma.storageRack.create({ data: { name: 'Rack C', code: 'C', zone: 'South Shelf', capacity: 50 } }),
  ]);

  const allSlots: any[] = [];
  for (const rack of racks) {
    const slotData = [];
    for (let i = 1; i <= 10; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      slotData.push({
        rackId: rack.id,
        slotNumber: `${rack.code}${numStr}`,
        capacity: 5,
        status: SlotStatus.AVAILABLE,
        updatedAt: new Date(),
      });
    }
    await prisma.storageSlot.createMany({ data: slotData });
    const created = await prisma.storageSlot.findMany({ where: { rackId: rack.id }, orderBy: { slotNumber: 'asc' } });
    allSlots.push(...created);
  }

  // 4. Create Admins
  console.log('Creating Admins...');
  await prisma.user.create({
    data: {
      email: 'admin@campusdrop.demo',
      passwordHash,
      role: Role.ADMIN,
      name: 'Dr. Vikram Malhotra',
      phone: '9876500000',
      admin: {
        create: {
          name: 'Dr. Vikram Malhotra',
          phone: '9876500000',
          department: 'Director of Campus Logistics',
        }
      }
    }
  });

  // 5. Create Security Guards
  console.log('Creating Security Guards...');
  const guards = await Promise.all([
    prisma.user.create({
      data: {
        email: 'guard@campusdrop.demo',
        passwordHash,
        role: Role.GUARD,
        name: 'Rajesh Kumar',
        phone: '9876500001',
        guard: {
          create: {
            badgeNumber: 'GD-001',
            name: 'Rajesh Kumar',
            phone: '9876500001',
            gateNumber: 'Main Gate 1',
            shift: 'Morning (08:00 - 16:00)',
          }
        }
      },
      include: { guard: true }
    }),
    prisma.user.create({
      data: {
        email: 'guard2@campusdrop.demo',
        passwordHash,
        role: Role.GUARD,
        name: 'Suresh Verma',
        phone: '9876500002',
        guard: {
          create: {
            badgeNumber: 'GD-002',
            name: 'Suresh Verma',
            phone: '9876500002',
            gateNumber: 'Main Gate 2',
            shift: 'Evening (16:00 - 24:00)',
          }
        }
      },
      include: { guard: true }
    }),
    prisma.user.create({
      data: {
        email: 'guard3@campusdrop.demo',
        passwordHash,
        role: Role.GUARD,
        name: 'Amit Patel',
        phone: '9876500003',
        guard: {
          create: {
            badgeNumber: 'GD-003',
            name: 'Amit Patel',
            phone: '9876500003',
            gateNumber: 'Hostel Gate',
            shift: 'Night (00:00 - 08:00)',
          }
        }
      },
      include: { guard: true }
    }),
  ]);

  const primaryGuard = guards[0].guard!;

  // 6. Create 2,300 University Students
  console.log('Creating 2,300 University Students (batched)...');
  const hostels = ['Aravali Hostel', 'Nilgiri Hostel', 'Shivalik Hostel', 'Vindhyachal Hostel', 'Himalaya Residence'];
  const departments = ['Computer Science', 'Management & Leadership', 'Design & Innovation', 'Psychology', 'Public Policy'];
  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Kabir', 'Ananya', 'Diya', 'Isha', 'Aadhya', 'Saanvi', 'Kiara', 'Myra', 'Pari', 'Anika', 'Navya', 'Avani', 'Riya', 'Siya', 'Tara', 'Rohan', 'Kunal', 'Manjeet', 'Varun', 'Neha', 'Pooja', 'Priya', 'Sneha', 'Deepak', 'Sanjay', 'Rahul', 'Nitin'];
  const lastNames = ['Sharma', 'Verma', 'Gupta', 'Malhotra', 'Mehta', 'Chopra', 'Singh', 'Kaur', 'Patel', 'Shah', 'Reddy', 'Rao', 'Nair', 'Menon', 'Iyer', 'Joshi', 'Bhat', 'Deshmukh', 'Kulkarni', 'Bose', 'Chatterjee', 'Banerjee', 'Mishra', 'Pandey', 'Trivedi', 'Saxena', 'Kapoor', 'Khanna', 'Bhasin', 'Soni'];

  // Primary Demo Student
  const demoUser = await prisma.user.create({
    data: {
      email: 'student@campusdrop.demo',
      passwordHash,
      role: Role.STUDENT,
      name: 'Manjeet Sharma',
      phone: '9876543210',
      student: {
        create: {
          studentId: 'CS2023-0142',
          name: 'Manjeet Sharma',
          phone: '9876543210',
          email: 'student@campusdrop.demo',
          hostel: 'Aravali Hostel',
          room: 'B-304',
          department: 'Computer Science',
          year: 3,
        }
      }
    },
    include: { student: true }
  });

  const allStudents = [demoUser.student!];

  const batchSize = 250;
  const targetStudents = 2300;

  for (let batchStart = 1; batchStart < targetStudents; batchStart += batchSize) {
    const studentBatch = [];
    const count = Math.min(batchSize, targetStudents - batchStart);

    for (let i = 0; i < count; i++) {
      const idx = batchStart + i;
      const fn = firstNames[idx % firstNames.length];
      const ln = lastNames[idx % lastNames.length];
      const name = `${fn} ${ln}`;
      const year = (idx % 4) + 1;
      const dep = departments[idx % departments.length];
      const hostel = hostels[idx % hostels.length];
      const room = `${String.fromCharCode(65 + (idx % 4))}-${100 + (idx % 300)}`;
      const studentId = `RU202${4 - (year - 1)}-${String(idx).padStart(4, '0')}`;
      const phone = `98${String(10000000 + idx).slice(0, 8)}`;
      const email = `student${idx}@rishihood.edu.in`;

      studentBatch.push({
        studentId,
        name,
        phone,
        email,
        hostel,
        room,
        department: dep,
        year,
      });
    }

    await prisma.student.createMany({ data: studentBatch });
  }

  const seededStudents = await prisma.student.findMany({ take: 200 });
  allStudents.push(...seededStudents.filter(s => s.id !== demoUser.student!.id));
  console.log('Seeded 2,300 students successfully.');

  // 7. Seed Active Stored Parcels for Demonstration
  console.log('Seeding regular parcel intake and storage operations...');
  const yy = String(new Date().getFullYear()).slice(-2);
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const dd = String(new Date().getDate()).padStart(2, '0');

  let seqCounter = 1;

  // Store 2 active parcels for Demo Student (Manjeet)
  const p1 = await prisma.delivery.create({
    data: {
      deliveryNumber: `DEL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-00001`,
      studentId: demoUser.student!.id,
      guardId: primaryGuard.id,
      deliveryPartnerId: partnerMap.get('amazon')!.id,
      status: DeliveryStatus.STORED,
      trackingNumber: 'TRK-AMZ-991204',
      notes: 'Textbooks carton box',
      receivedAt: new Date(Date.now() - 3 * 3600 * 1000),
      parcel: {
        create: {
          parcelId: `CD-${yy}${mm}${dd}-${String(seqCounter++).padStart(4, '0')}`,
          studentId: demoUser.student!.id,
          storageSlotId: allSlots[0].id, // Rack A Slot A01
          status: ParcelStatus.STORED,
          notes: 'Textbooks carton box',
          trackingNumber: 'TRK-AMZ-991204',
          receivedById: primaryGuard.id,
          otpCode: '482910',
          otpExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        }
      }
    }
  });

  const p2 = await prisma.delivery.create({
    data: {
      deliveryNumber: `DEL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-00002`,
      studentId: demoUser.student!.id,
      guardId: primaryGuard.id,
      deliveryPartnerId: partnerMap.get('flipkart')!.id,
      status: DeliveryStatus.STORED,
      trackingNumber: 'TRK-FK-550192',
      notes: 'Electronics fragile package',
      receivedAt: new Date(Date.now() - 1 * 3600 * 1000),
      parcel: {
        create: {
          parcelId: `CD-${yy}${mm}${dd}-${String(seqCounter++).padStart(4, '0')}`,
          studentId: demoUser.student!.id,
          storageSlotId: allSlots[1].id, // Rack A Slot A02
          status: ParcelStatus.STORED,
          notes: 'Electronics fragile package',
          trackingNumber: 'TRK-FK-550192',
          receivedById: primaryGuard.id,
          otpCode: '193820',
          otpExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        }
      }
    }
  });

  // Seed 25 more current parcels across active slots
  const partnersList = Array.from(partnerMap.values());
  for (let i = 0; i < 25; i++) {
    const student = allStudents[i % allStudents.length];
    const partner = partnersList[i % partnersList.length];
    const slot = allSlots[i % allSlots.length];
    const isCollected = i % 3 === 0;

    const deliveryNumber = `DEL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(i + 10).padStart(5, '0')}`;
    const parcelId = `CD-${yy}${mm}${dd}-${String(seqCounter++).padStart(4, '0')}`;
    const receivedAt = new Date(Date.now() - (i * 2) * 3600 * 1000);

    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber,
        studentId: student.id,
        guardId: primaryGuard.id,
        deliveryPartnerId: partner.id,
        status: isCollected ? DeliveryStatus.COLLECTED : DeliveryStatus.STORED,
        trackingNumber: `TRK-${partner.slug.toUpperCase()}-${100000 + i}`,
        notes: i % 2 === 0 ? 'Standard parcel' : 'Fragile sticker',
        receivedAt,
        completedAt: isCollected ? new Date(receivedAt.getTime() + 45 * 60 * 1000) : null,
        parcel: {
          create: {
            parcelId,
            studentId: student.id,
            storageSlotId: slot.id,
            status: isCollected ? ParcelStatus.COLLECTED : ParcelStatus.STORED,
            notes: i % 2 === 0 ? 'Standard parcel' : 'Fragile sticker',
            trackingNumber: `TRK-${partner.slug.toUpperCase()}-${100000 + i}`,
            receivedById: primaryGuard.id,
            collectedAt: isCollected ? new Date(receivedAt.getTime() + 45 * 60 * 1000) : null,
          }
        }
      },
      include: { parcel: true }
    });

    if (isCollected) {
      await prisma.pickup.create({
        data: {
          deliveryId: delivery.id,
          parcelId: delivery.parcel!.id,
          studentId: student.id,
          guardId: primaryGuard.id,
          verificationMethod: i % 2 === 0 ? VerificationMethod.QR : VerificationMethod.OTP,
          pickupLocation: 'Main Gate Delivery Hub',
          verifiedAt: new Date(receivedAt.getTime() + 45 * 60 * 1000),
        }
      });
    }
  }

  // Update initial slot statuses based on assigned active parcels
  for (const slot of allSlots) {
    const activeCount = await prisma.parcel.count({
      where: {
        storageSlotId: slot.id,
        status: { in: [ParcelStatus.STORED, ParcelStatus.READY_FOR_COLLECTION, ParcelStatus.RECEIVED] }
      }
    });

    let status: SlotStatus = SlotStatus.AVAILABLE;
    if (activeCount >= 5) status = SlotStatus.FULL;
    else if (activeCount > 0) status = SlotStatus.OCCUPIED;

    await prisma.storageSlot.update({
      where: { id: slot.id },
      data: { status }
    });
  }

  console.log('Seed complete successfully.');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('  Student: student@campusdrop.demo / CampusDrop@2026 (Phone: 9876543210)');
  console.log('  Guard:   guard@campusdrop.demo   / CampusDrop@2026 (Badge: GD-001)');
  console.log('  Admin:   admin@campusdrop.demo   / CampusDrop@2026');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from '../config';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import { SlotStatus } from '@prisma/client';

export class StorageService {
  /**
   * Validates manual slot selection and assigns parcel to the chosen rack slot.
   */
  async assignManualSlot(slotId: string, txPrisma?: any): Promise<{ id: string; slotNumber: string; rackName: string; rackId: string }> {
    const client = txPrisma || prisma;

    const slot = await client.storageSlot.findUnique({
      where: { id: slotId },
      include: {
        rack: true,
        parcels: {
          where: {
            status: { in: ['STORED', 'READY_FOR_COLLECTION', 'RECEIVED'] }
          }
        }
      }
    });

    if (!slot) {
      throw new NotFoundError('Storage slot not found.');
    }

    if (!slot.rack.isActive) {
      throw new ConflictError('The selected rack is currently inactive.');
    }

    if (slot.status === SlotStatus.MAINTENANCE || slot.status === SlotStatus.ISSUE) {
      throw new ConflictError(`Slot ${slot.slotNumber} is under maintenance.`);
    }

    const currentOccupied = slot.parcels.length;
    if (currentOccupied >= slot.capacity) {
      throw new ConflictError(`Slot ${slot.slotNumber} in ${slot.rack.name} is full (${currentOccupied}/${slot.capacity} parcels). Please select another slot.`);
    }

    // New occupied count after storing this parcel
    const newOccupied = currentOccupied + 1;
    const newStatus = newOccupied >= slot.capacity ? SlotStatus.FULL : SlotStatus.OCCUPIED;

    await client.storageSlot.update({
      where: { id: slot.id },
      data: { status: newStatus }
    });

    return {
      id: slot.id,
      slotNumber: slot.slotNumber,
      rackName: slot.rack.name,
      rackId: slot.rack.id,
    };
  }

  /**
   * Recalculates and updates the slot status upon parcel handover / removal.
   */
  async refreshSlotStatus(slotId: string, txPrisma?: any): Promise<void> {
    const client = txPrisma || prisma;

    const slot = await client.storageSlot.findUnique({
      where: { id: slotId },
      include: {
        parcels: {
          where: {
            status: { in: ['STORED', 'READY_FOR_COLLECTION', 'RECEIVED'] }
          }
        }
      }
    });

    if (!slot) return;

    if (slot.status === SlotStatus.MAINTENANCE || slot.status === SlotStatus.ISSUE) {
      return;
    }

    const activeCount = slot.parcels.length;
    let newStatus: SlotStatus = SlotStatus.AVAILABLE;

    if (activeCount === 0) {
      newStatus = SlotStatus.AVAILABLE;
    } else if (activeCount >= slot.capacity) {
      newStatus = SlotStatus.FULL;
    } else {
      newStatus = SlotStatus.OCCUPIED;
    }

    await client.storageSlot.update({
      where: { id: slot.id },
      data: { status: newStatus }
    });
  }

  /**
   * Release / refresh slot status alias
   */
  async releaseSlot(slotId: string, txPrisma?: any): Promise<void> {
    return this.refreshSlotStatus(slotId, txPrisma);
  }

  /**
   * Returns complete storage overview with configurable slot capacity and parcel breakdowns
   */
  async getStorageOverview() {
    const racks = await prisma.storageRack.findMany({
      where: { isActive: true },
      include: {
        slots: {
          include: {
            parcels: {
              where: {
                status: { in: ['STORED', 'READY_FOR_COLLECTION', 'RECEIVED'] }
              },
              include: {
                student: true,
                delivery: {
                  include: { deliveryPartner: true }
                }
              }
            }
          },
          orderBy: { slotNumber: 'asc' }
        }
      },
      orderBy: { code: 'asc' }
    });

    let totalRacks = racks.length;
    let totalSlots = 0;
    let totalCapacity = 0;
    let totalOccupiedSlots = 0;
    let totalAvailableSlots = 0;
    let totalStoredParcels = 0;

    const formattedRacks = racks.map(rack => {
      let rackCapacityParcels = 0;
      let rackStoredParcels = 0;
      let rackOccupiedSlots = 0;
      let rackAvailableSlots = 0;

      const formattedSlots = rack.slots.map(s => {
        const activeParcelsCount = s.parcels.length;
        rackCapacityParcels += s.capacity;
        rackStoredParcels += activeParcelsCount;

        const isFull = activeParcelsCount >= s.capacity;
        const isAvailable = activeParcelsCount < s.capacity && s.status !== SlotStatus.MAINTENANCE && s.status !== SlotStatus.ISSUE;

        if (activeParcelsCount > 0) rackOccupiedSlots++;
        if (isAvailable) rackAvailableSlots++;

        return {
          id: s.id,
          rackId: s.rackId,
          slotNumber: s.slotNumber,
          capacity: s.capacity,
          currentOccupied: activeParcelsCount,
          availableCapacity: Math.max(0, s.capacity - activeParcelsCount),
          status: isFull ? SlotStatus.FULL : (activeParcelsCount > 0 ? SlotStatus.OCCUPIED : s.status),
          updatedAt: s.updatedAt,
          parcels: s.parcels.map(p => ({
            id: p.id,
            parcelId: p.parcelId,
            studentName: p.student.name,
            studentPhone: p.student.phone,
            studentRoll: p.student.studentId,
            partner: p.delivery.deliveryPartner.name,
            partnerColor: p.delivery.deliveryPartner.color,
            receivedAt: p.delivery.receivedAt,
            daysWaiting: Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          }))
        };
      });

      totalSlots += rack.slots.length;
      totalCapacity += rackCapacityParcels;
      totalOccupiedSlots += rackOccupiedSlots;
      totalAvailableSlots += rackAvailableSlots;
      totalStoredParcels += rackStoredParcels;

      return {
        id: rack.id,
        name: rack.name,
        code: rack.code,
        zone: rack.zone,
        capacity: rackCapacityParcels,
        totalSlots: rack.slots.length,
        storedParcels: rackStoredParcels,
        occupiedSlots: rackOccupiedSlots,
        availableSlots: rackAvailableSlots,
        utilization: rackCapacityParcels > 0 ? Math.round((rackStoredParcels / rackCapacityParcels) * 100) : 0,
        slots: formattedSlots,
      };
    });

    const overallUtilization = totalCapacity > 0 ? Math.round((totalStoredParcels / totalCapacity) * 100) : 0;

    return {
      summary: {
        totalRacks,
        totalSlots,
        totalCapacity,
        totalStoredParcels,
        totalOccupiedSlots,
        totalAvailableSlots,
        totalOccupied: totalOccupiedSlots,
        overallUtilization,
      },
      racks: formattedRacks,
    };
  }

  /**
   * Admin: Create a new Rack
   */
  async createRack(data: { name: string; code: string; zone?: string; initialSlots?: number; slotCapacity?: number }) {
    const existing = await prisma.storageRack.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }]
      }
    });

    if (existing) {
      throw new ConflictError('A rack with this name or code already exists.');
    }

    const numSlots = Math.max(1, data.initialSlots || 10);
    const slotCap = Math.max(1, data.slotCapacity || 5);

    const rack = await prisma.storageRack.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        zone: (data.zone || 'Main Gate Hub').trim(),
        capacity: numSlots * slotCap,
      }
    });

    // Generate initial slots (e.g. A01, A02, ...)
    const slotInserts = [];
    for (let i = 1; i <= numSlots; i++) {
      const slotNum = `${rack.code}${String(i).padStart(2, '0')}`;
      slotInserts.push({
        rackId: rack.id,
        slotNumber: slotNum,
        capacity: slotCap,
        status: SlotStatus.AVAILABLE,
      });
    }

    await prisma.storageSlot.createMany({
      data: slotInserts
    });

    return rack;
  }

  /**
   * Admin: Update Rack
   */
  async updateRack(rackId: string, data: { name?: string; zone?: string; isActive?: boolean }) {
    const rack = await prisma.storageRack.findUnique({ where: { id: rackId } });
    if (!rack) throw new NotFoundError('Rack not found');

    return prisma.storageRack.update({
      where: { id: rackId },
      data: {
        name: data.name ? data.name.trim() : undefined,
        zone: data.zone ? data.zone.trim() : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      }
    });
  }

  /**
   * Admin: Delete Rack
   * RULE: Admin must NOT be allowed to delete a rack that contains parcels.
   */
  async deleteRack(rackId: string) {
    const activeParcels = await prisma.parcel.count({
      where: {
        storageSlot: { rackId },
        status: { in: ['STORED', 'READY_FOR_COLLECTION', 'RECEIVED'] }
      }
    });

    if (activeParcels > 0) {
      throw new ConflictError('Cannot delete this storage location because parcels are currently stored here.');
    }

    await prisma.storageRack.delete({
      where: { id: rackId }
    });

    return { message: 'Storage rack removed successfully.' };
  }

  /**
   * Admin: Create Slot
   */
  async createSlot(data: { rackId: string; slotNumber: string; capacity?: number }) {
    const rack = await prisma.storageRack.findUnique({ where: { id: data.rackId } });
    if (!rack) throw new NotFoundError('Rack not found');

    const existing = await prisma.storageSlot.findUnique({
      where: {
        rackId_slotNumber: {
          rackId: data.rackId,
          slotNumber: data.slotNumber.trim().toUpperCase(),
        }
      }
    });

    if (existing) {
      throw new ConflictError(`Slot ${data.slotNumber} already exists in ${rack.name}.`);
    }

    return prisma.storageSlot.create({
      data: {
        rackId: data.rackId,
        slotNumber: data.slotNumber.trim().toUpperCase(),
        capacity: Math.max(1, data.capacity || 5),
        status: SlotStatus.AVAILABLE,
      }
    });
  }

  /**
   * Admin: Update Slot Capacity and/or Status
   */
  async updateSlot(slotId: string, data: { capacity?: number; status?: SlotStatus }) {
    const slot = await prisma.storageSlot.findUnique({
      where: { id: slotId },
      include: {
        parcels: {
          where: { status: { in: ['STORED', 'READY_FOR_COLLECTION', 'RECEIVED'] } }
        }
      }
    });

    if (!slot) throw new NotFoundError('Storage slot not found');

    if (data.capacity !== undefined && data.capacity < slot.parcels.length) {
      throw new ConflictError(`Cannot set capacity to ${data.capacity} because ${slot.parcels.length} parcels are currently stored in this slot.`);
    }

    const updated = await prisma.storageSlot.update({
      where: { id: slotId },
      data: {
        capacity: data.capacity !== undefined ? Math.max(1, data.capacity) : undefined,
        status: data.status || undefined,
      }
    });

    return updated;
  }

  /**
   * Admin: Delete Slot
   * RULE: Admin must NOT be allowed to delete a slot that contains parcels.
   */
  async deleteSlot(slotId: string) {
    const activeParcels = await prisma.parcel.count({
      where: {
        storageSlotId: slotId,
        status: { in: ['STORED', 'READY_FOR_COLLECTION', 'RECEIVED'] }
      }
    });

    if (activeParcels > 0) {
      throw new ConflictError('Cannot delete this storage location because parcels are currently stored here.');
    }

    await prisma.storageSlot.delete({
      where: { id: slotId }
    });

    return { message: 'Storage slot removed successfully.' };
  }
}

export const storageService = new StorageService();

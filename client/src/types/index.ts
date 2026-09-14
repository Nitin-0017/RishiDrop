export type Role = 'STUDENT' | 'GUARD' | 'ADMIN';

export type DeliveryStatus = 'RECEIVED' | 'STORED' | 'READY_FOR_COLLECTION' | 'HANDED_OVER' | 'COLLECTED' | 'RETURNED' | 'CANCELLED';

export type ParcelStatus = 'RECEIVED' | 'STORED' | 'READY_FOR_COLLECTION' | 'HANDED_OVER' | 'COLLECTED' | 'OVERDUE' | 'RETURNED' | 'CANCELLED';

export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'FULL' | 'MAINTENANCE' | 'ISSUE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string;
  avatar?: string | null;
  student?: {
    id: string;
    studentId: string;
    hostel?: string;
    room?: string;
    department?: string;
  };
  guard?: {
    id: string;
    badgeNumber: string;
    gateNumber: string;
    shift: string;
    profilePhoto?: string | null;
  };
  admin?: {
    id: string;
    department: string;
  };
}

export interface GuardProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  badgeNumber: string;
  gateNumber: string;
  shift: string;
  profilePhoto?: string | null;
  isActive: boolean;
  joinedDate: string;
  createdAt?: string;
  totalDeliveries?: number;
  totalPickups?: number;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  maskedPhone: string;
  email: string;
  hostel?: string;
  room?: string;
  department?: string;
  year?: number;
  isWhatsAppActive?: boolean;
  activeParcelsCount?: number;
  stats?: {
    totalDeliveries: number;
    totalPickups: number;
    activeParcelsCount: number;
  };
  activeParcels?: Array<{
    id: string;
    parcelId: string;
    partner: string;
    partnerColor?: string;
    status?: ParcelStatus;
    slot: string;
    rackName?: string;
    slotNumber?: string;
    notes?: string | null;
    trackingNumber?: string | null;
    receivedAt: string;
  }>;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  color?: string;
}

export interface DeliveryItem {
  id: string;
  deliveryNumber: string;
  status: DeliveryStatus;
  trackingNumber?: string | null;
  notes?: string | null;
  receivedAt: string;
  completedAt?: string | null;
  student: {
    id: string;
    name: string;
    studentId: string;
    phone?: string;
    maskedPhone: string;
    hostel?: string;
    room?: string;
  };
  guard: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  partner: {
    id: string;
    name: string;
    color?: string;
    slug?: string;
  };
  parcel?: {
    id: string;
    parcelId: string;
    slot: string;
    slotId?: string;
    qrToken?: string | null;
    qrData?: string | null;
    qrPayload?: string | null;
    whatsappStatus?: string | null;
    whatsappError?: string | null;
  } | null;
  whatsappStatus?: string | null;
}

export interface ParcelDetails {
  id: string;
  parcelId: string;
  status: ParcelStatus;
  notes?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  collectedAt?: string | null;
  qrToken?: string | null;
  qrData?: string | null;
  qrPayload?: string | null;
  whatsappStatus?: string | null;
  whatsappError?: string | null;
  student: {
    id: string;
    name: string;
    studentId: string;
    phone: string;
    maskedPhone: string;
    email: string;
    hostel?: string;
    room?: string;
    department?: string;
  };
  partner: {
    id: string;
    name: string;
    color?: string;
  };
  storage?: {
    id: string;
    rackId: string;
    rackName: string;
    slotNumber: string;
    location: string;
  } | null;
  receivedBy: {
    id: string;
    name: string;
    badgeNumber: string;
    gateNumber: string;
  };
  receivedAt: string;
  handedOverBy?: {
    id: string;
    name: string;
    badgeNumber: string;
  } | null;
  handedOverAt?: string | null;
  verificationMethod?: string | null;
}

export interface StorageSlot {
  id: string;
  rackId: string;
  slotNumber: string;
  capacity: number;
  currentOccupied: number;
  availableCapacity: number;
  status: SlotStatus;
  updatedAt?: string;
  parcel?: {
    id: string;
    parcelId: string;
    studentName: string;
    studentPhone: string;
    studentRoll: string;
    partner: string;
    partnerColor?: string;
    receivedAt: string;
    daysWaiting: number;
  } | null;
  parcels?: Array<{
    id: string;
    parcelId: string;
    studentName: string;
    studentPhone: string;
    studentRoll: string;
    partner: string;
    partnerColor?: string;
    receivedAt: string;
    daysWaiting: number;
  }>;
}

export interface StorageRack {
  id: string;
  name: string;
  code: string;
  zone: string;
  capacity: number;
  totalSlots: number;
  storedParcels: number;
  occupiedSlots: number;
  availableSlots: number;
  utilization: number;
  stats?: {
    occupied: number;
    empty: number;
    maintenance: number;
    issue: number;
  };
  slots: StorageSlot[];
}

export interface StorageOverview {
  summary: {
    totalRacks: number;
    totalSlots: number;
    totalCapacity: number;
    totalStoredParcels: number;
    totalOccupiedSlots: number;
    totalAvailableSlots: number;
    totalOccupied?: number;
    overallUtilization: number;
  };
  racks: StorageRack[];
}

export interface CreateDeliveryParams {
  studentId: string;
  deliveryPartnerId: string;
  rackId?: string | null;
  slotId?: string | null;
  storageType?: 'RACK' | 'OVERSIZED';
  trackingNumber?: string | null;
  notes?: string | null;
}

export interface CreateDeliveryResponse {
  deliveryId: string;
  parcelId: string;
  internalId: string;
  deliveryNumber: string;
  status: DeliveryStatus;
  storageType?: 'RACK' | 'OVERSIZED';
  oversizedReference?: string | null;
  student: {
    id: string;
    name: string;
    studentId: string;
    phone: string;
    maskedPhone: string;
    hostel?: string;
    room?: string;
  };
  partner: {
    id: string;
    name: string;
    color?: string;
  };
  storage: {
    slotId: string;
    rack: string;
    slot: string;
  };
  receivedAt: string;
}

export interface OverviewMetrics {
  summary: {
    totalDeliveries: number;
    storedParcels: number;
    totalPending: number;
    collectedDeliveries: number;
    storageUtilization: number;
    totalSlots: number;
    occupiedSlots: number;
    availableSlots: number;
    avgPickupTimeMinutes: number;
    unclaimed: {
      unclaimed24h: number;
      unclaimed48h: number;
      unclaimed72hPlus: number;
      totalUnclaimed: number;
    };
  };
  today: {
    total: number;
    stored: number;
    collected: number;
    pending: number;
  };
  recentActivity: Array<{
    id: string;
    deliveryNumber: string;
    parcelId?: string;
    studentName: string;
    studentRoll?: string;
    partner: string;
    partnerColor?: string;
    status: string;
    slot: string;
    receivedAt: string;
    whatsappStatus?: string;
    whatsappError?: string;
  }>;
}

export interface DetailedAnalytics {
  dailyTrends: Array<{ date: string; total: number; count: number; collected: number }>;
  hourlyDistribution: Array<{ hour: string; count: number }>;
  partnerDistribution: Array<{ name: string; slug: string; color: string; count: number }>;
  guardPerformance: Array<{
    id: string;
    name: string;
    badgeNumber: string;
    deliveriesReceived: number;
    pickupsProcessed: number;
    totalActions: number;
  }>;
}

export interface ForecastData {
  targetDayName: string;
  targetDate: string;
  historicalBaseline: {
    daysAnalyzed: number;
    averageDailyVolume: number;
    recentTrendSlope: number;
    lastWeekAvg?: number;
    fourWeekAvg?: number;
    sameDayLastWeek?: number;
  };
  predictions: {
    expectedTotalDeliveries: number;
    confidenceScore: number;
    peakWindow: {
      period: string;
      expectedVolume: number;
    };
    rushHours: string[];
    storageForecast: {
      expectedOccupancyRate: number;
      overflowRisk: string;
      peakOccupancyPct?: number;
    };
  };
  recommendations: Array<{
    id?: string;
    type: string;
    title: string;
    priority: string;
    description: string;
    actionableStep: string;
  }>;
}

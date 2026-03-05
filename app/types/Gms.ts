// ============================================
// 🌱 GMS (Garden Management System) Types
// Nostr kinds: 31000-31099
// ============================================

/** Kind 31000 – Plant record */
export interface GmsPlant {
  /** Nostr event id (raw) */
  eventId: string;
  /** d-tag (UUID) — unique identifier per plant */
  id: string;
  name: string;
  /** vegetable | fruit | herb | flower | grain */
  category: string;
  /** tomato | mango | basil … */
  type: string;
  variety?: string;
  quantity: number;
  unit: string;
  plot: string;
  row?: string;
  position?: string;
  plantedDate: string; // ISO date YYYY-MM-DD
  expectedHarvestDate?: string;
  seedSource?: string;
  plantingCost?: number;
  /** seedling | growing | flowering | mature | harvesting */
  status: string;
  statusHistory?: GmsPlantHistory[];
  notes?: string;
  generateQrCode?: boolean;
  createdAt: number; // UNIX timestamp
}

/** History of status changes for a GmsPlant */
export interface GmsPlantHistory {
  status: string;
  date: string; // ISO date/datetime when the status changed
  eventId: string;
  notes?: string;
}

/** Kind 31001 – Care activity log entry */
export interface GmsCareLog {
  eventId: string;
  id: string;
  /** d-tag of the related GmsPlant */
  plantId: string;
  plantName?: string;
  plot?: string;
  /** watering | fertilizing | pruning | pest_control | weeding | mulching */
  activity: string;
  date: string; // ISO datetime
  cost?: number;
  notes?: string;
  createdAt: number;
}

/** Kind 31002 – Recurring care schedule */
export interface GmsSchedule {
  eventId: string;
  id: string;
  plantId: string;
  plantName?: string;
  plot?: string;
  activity: string;
  /** daily | weekly | biweekly | monthly */
  frequency: string;
  startDate: string;
  nextDue: string; // computed / stored ISO date
  isActive: boolean;
  notes?: string;
  createdAt: number;
}

/** Kind 31003 – Harvest record */
export interface GmsHarvest {
  eventId: string;
  id: string;
  plantId: string;
  plantName?: string;
  quantity: number;
  unit: string;
  date: string;
  notes?: string;
  revenue?: number;
  /** in_stock | sold | processing | expired */
  status?: string;
  qualityGrade?: string;
  createdAt: number;
}

/** Offline queue entry – stored in localStorage when offline */
export interface GmsOfflineAction {
  kind: number;
  tags: string[][];
  content: string;
  createdAt: number;
}

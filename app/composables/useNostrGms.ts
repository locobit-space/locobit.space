// composables/useNostrGms.ts
// Garden Management System integrated with Nostr
// Plant kinds: 31000-31099

import { finalizeEvent } from "nostr-tools/pure";
import { hexToBytes } from "@noble/hashes/utils";

import type {
  GmsPlant,
  GmsCareLog,
  GmsSchedule,
  GmsHarvest,
  GmsOfflineAction,
  GmsPlantHistory,
} from "~/types/Gms";

// ─────────────────────────────────────────
// 🌱 GMS Kind Constants (31000-31099)
// ─────────────────────────────────────────
export const GMS_KINDS = {
  PLANT: 31000,
  CARE_LOG: 31001,
  SCHEDULE: 31002,
  HARVEST: 31003,
} as const;

const OFFLINE_QUEUE_KEY = "gms_offline_queue";

export const useNostrGms = () => {
  const { $nostr } = useNuxtApp();
  const { pool } = $nostr;
  const { user } = useNostrUser();
  const { DEFAULT_RELAYS: RELAYS } = useNostrRelay();

  // ─── Reactive state ───────────────────────────────────────────
  const plants = useState<GmsPlant[]>("gms-plants", () => []);
  const careLogs = useState<GmsCareLog[]>("gms-care-logs", () => []);
  const schedules = useState<GmsSchedule[]>("gms-schedules", () => []);
  const harvests = useState<GmsHarvest[]>("gms-harvests", () => []);
  const isLoading = useState<boolean>("gms-is-loading", () => false);
  const error = useState<any>("gms-error", () => null);
  const isOnline = useState<boolean>("gms-is-online", () =>
    import.meta.client ? navigator.onLine : true,
  );

  // Computed stats used by the dashboard
  const totalPlants = computed(() => plants.value.length);
  const activePlots = computed(
    () => [...new Set(plants.value.map((p) => p.plot))].length,
  );
  const pendingCare = computed(() => {
    const now = new Date();
    return schedules.value.filter((s) => {
      if (!s.isActive) return false;
      return new Date(s.nextDue) <= now;
    }).length;
  });

  // ─── Online / offline detection ───────────────────────────────
  if (import.meta.client) {
    window.addEventListener("online", () => {
      isOnline.value = true;
      syncOfflineQueue();
    });
    window.addEventListener("offline", () => {
      isOnline.value = false;
    });
  }

  // ─── Offline queue helpers ────────────────────────────────────
  const getOfflineQueue = (): GmsOfflineAction[] => {
    if (!import.meta.client) return [];
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const pushToOfflineQueue = (action: GmsOfflineAction) => {
    if (!import.meta.client) return;
    const queue = getOfflineQueue();
    queue.push(action);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  };

  const clearOfflineQueue = () => {
    if (!import.meta.client) return;
    localStorage.setItem(OFFLINE_QUEUE_KEY, "[]");
  };

  /**
   * Flush queued events back to relays once we're online again
   */
  const syncOfflineQueue = async () => {
    if (!user.value || !isOnline.value) return;
    const queue = getOfflineQueue();
    if (!queue.length) return;

    for (const action of queue) {
      try {
        const eventTemplate = {
          kind: action.kind,
          created_at: action.createdAt,
          tags: action.tags,
          content: action.content,
        };
        const signedEvent = finalizeEvent(
          eventTemplate,
          hexToBytes(user.value.privateKey),
        );
        await Promise.any(pool.publish(RELAYS, signedEvent));
      } catch (e) {
        console.warn("[GMS] Failed to sync queued event:", e);
      }
    }
    clearOfflineQueue();
  };

  /**
   * Publish or queue an event
   */
  const publishOrQueue = async (
    kind: number,
    tags: string[][],
    content = "",
  ) => {
    if (!user.value) return false;

    const createdAt = Math.floor(Date.now() / 1000);
    const eventTemplate = { kind, created_at: createdAt, tags, content };

    if (isOnline.value) {
      try {
        const signedEvent = finalizeEvent(
          eventTemplate,
          hexToBytes(user.value.privateKey),
        );
        await Promise.any(pool.publish(RELAYS, signedEvent));
        return true;
      } catch (e) {
        error.value = e;
        return false;
      }
    } else {
      // Queue for later
      pushToOfflineQueue({ kind, tags, content, createdAt });
      return true; // optimistic
    }
  };

  // ─── Tag parser helpers ───────────────────────────────────────
  const tag = (event: any, name: string) =>
    event.tags?.find((t: string[]) => t[0] === name)?.[1] ?? "";

  // ─────────────────────────────────────────────────────────────
  // 🌿 PLANTS  (kind 31000)
  // ─────────────────────────────────────────────────────────────

  const loadPlants = async () => {
    if (!user.value) return;
    isLoading.value = true;
    try {
      const events = await pool.querySync(RELAYS, {
        kinds: [GMS_KINDS.PLANT],
        authors: [user.value.publicKey],
        "#t": ["gms-plant"],
      });

      // Deduplicate by d-tag (keep newest per id), but track all events for history
      const map = new Map<string, any>();
      const historyMap = new Map<string, GmsPlantHistory[]>();

      for (const ev of events) {
        const d = tag(ev, "d");
        if (!d) continue;

        // Add to history
        const status = tag(ev, "status") || "seedling";
        const historyItem: GmsPlantHistory = {
          status,
          date: new Date(ev.created_at * 1000).toISOString(),
          eventId: ev.id,
        };

        if (!historyMap.has(d)) {
          historyMap.set(d, [historyItem]);
        } else {
          historyMap.get(d)!.push(historyItem);
        }

        const existing = map.get(d);
        if (!existing || ev.created_at > existing.created_at) map.set(d, ev);
      }

      // Sort history by date descending
      for (const [id, history] of historyMap.entries()) {
        history.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
      }

      plants.value = [...map.values()].map((ev) => ({
        eventId: ev.id,
        id: tag(ev, "d"),
        name: tag(ev, "name"),
        category: tag(ev, "category"),
        type: tag(ev, "plant-type"),
        variety: tag(ev, "variety"),
        quantity: Number(tag(ev, "quantity")) || 1,
        unit: tag(ev, "unit"),
        plot: tag(ev, "plot"),
        row: tag(ev, "row"),
        position: tag(ev, "position"),
        plantedDate: tag(ev, "planted"),
        expectedHarvestDate: tag(ev, "expected-harvest"),
        seedSource: tag(ev, "seed-source"),
        plantingCost: Number(tag(ev, "planting-cost")) || 0,
        status: tag(ev, "status") || "seedling",
        notes: ev.content,
        createdAt: ev.created_at,
        statusHistory: historyMap.get(tag(ev, "d")) || [],
      }));
    } catch (e) {
      error.value = e;
    } finally {
      isLoading.value = false;
    }
  };

  const createPlant = async (
    data: Omit<GmsPlant, "id" | "eventId" | "createdAt" | "status">,
  ) => {
    const id = crypto.randomUUID();
    const tags: string[][] = [
      ["d", id],
      ["t", "gms-plant"],
      ["name", data.name],
      ["category", data.category],
      ["plant-type", data.type],
      ["quantity", String(data.quantity)],
      ["unit", data.unit],
      ["plot", data.plot],
      ["status", "seedling"],
      ["planted", data.plantedDate],
    ];
    if (data.variety) tags.push(["variety", data.variety]);
    if (data.row) tags.push(["row", data.row]);
    if (data.position) tags.push(["position", data.position]);
    if (data.expectedHarvestDate)
      tags.push(["expected-harvest", data.expectedHarvestDate]);
    if (data.seedSource) tags.push(["seed-source", data.seedSource]);
    if (data.plantingCost)
      tags.push(["planting-cost", String(data.plantingCost)]);

    const success = await publishOrQueue(
      GMS_KINDS.PLANT,
      tags,
      data.notes || "",
    );

    if (success) {
      // Optimistic update
      plants.value.unshift({
        eventId: "",
        id,
        status: "seedling",
        createdAt: Math.floor(Date.now() / 1000),
        ...data,
      });
    }
    return success ? id : null;
  };

  const updatePlantStatus = async (id: string, status: string) => {
    const plant = plants.value.find((p) => p.id === id);
    if (!plant) return false;

    const tags: string[][] = [
      ["d", id],
      ["t", "gms-plant"],
      ["name", plant.name],
      ["category", plant.category],
      ["plant-type", plant.type],
      ["quantity", String(plant.quantity)],
      ["unit", plant.unit],
      ["plot", plant.plot],
      ["status", status],
      ["planted", plant.plantedDate],
    ];

    const success = await publishOrQueue(
      GMS_KINDS.PLANT,
      tags,
      plant.notes || "",
    );
    if (success) {
      const idx = plants.value.findIndex((p) => p.id === id);
      if (idx !== -1) plants.value[idx]!.status = status;
    }
    return success;
  };

  // ─────────────────────────────────────────────────────────────
  // 🪣  CARE LOGS  (kind 31001)
  // ─────────────────────────────────────────────────────────────

  const loadCareLogs = async (plantId?: string) => {
    if (!user.value) return;
    isLoading.value = true;
    try {
      const filter: any = {
        kinds: [GMS_KINDS.CARE_LOG],
        authors: [user.value.publicKey],
        "#t": ["gms-care"],
      };
      if (plantId) filter["#p-ref"] = [plantId];

      const events = await pool.querySync(RELAYS, filter);

      // Deduplicate by event.id since multiple relays can return the same event
      const map = new Map<string, any>();
      for (const ev of events) {
        if (!map.has(ev.id)) map.set(ev.id, ev);
      }

      const logs: GmsCareLog[] = [...map.values()].map((ev: any) => {
        const plant = plants.value.find((p) => p.id === tag(ev, "p-ref"));
        return {
          eventId: ev.id,
          id: tag(ev, "d"),
          plantId: tag(ev, "p-ref"),
          plantName: plant?.name,
          plot: plant?.plot,
          activity: tag(ev, "activity"),
          date: tag(ev, "date"),
          cost: Number(tag(ev, "cost")) || 0,
          notes: ev.content,
          createdAt: ev.created_at,
        };
      });

      careLogs.value = logs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } catch (e) {
      error.value = e;
    } finally {
      isLoading.value = false;
    }
  };

  const createCareLog = async (data: {
    plantId: string;
    activity: string;
    date: string;
    cost?: number;
    notes?: string;
  }) => {
    const id = crypto.randomUUID();
    const tags: string[][] = [
      ["d", id],
      ["t", "gms-care"],
      ["p-ref", data.plantId],
      ["activity", data.activity],
      ["date", data.date],
    ];
    if (data.cost) tags.push(["cost", String(data.cost)]);

    const success = await publishOrQueue(
      GMS_KINDS.CARE_LOG,
      tags,
      data.notes || "",
    );

    if (success) {
      const plant = plants.value.find((p) => p.id === data.plantId);
      careLogs.value.unshift({
        eventId: "",
        id,
        plantName: plant?.name,
        plot: plant?.plot,
        createdAt: Math.floor(Date.now() / 1000),
        ...data,
      });
    }
    return success;
  };

  // ─────────────────────────────────────────────────────────────
  // 📅  SCHEDULES  (kind 31002)
  // ─────────────────────────────────────────────────────────────

  const loadSchedules = async () => {
    if (!user.value) return;
    isLoading.value = true;
    try {
      const events = await pool.querySync(RELAYS, {
        kinds: [GMS_KINDS.SCHEDULE],
        authors: [user.value.publicKey],
        "#t": ["gms-schedule"],
      });

      // Deduplicate by d-tag
      const map = new Map<string, any>();
      for (const ev of events) {
        const d = tag(ev, "d");
        if (!d) continue;
        const existing = map.get(d);
        if (!existing || ev.created_at > existing.created_at) map.set(d, ev);
      }

      schedules.value = [...map.values()].map((ev) => {
        const plant = plants.value.find((p) => p.id === tag(ev, "p-ref"));
        return {
          eventId: ev.id,
          id: tag(ev, "d"),
          plantId: tag(ev, "p-ref"),
          plantName: plant?.name,
          plot: plant?.plot,
          activity: tag(ev, "activity"),
          frequency: tag(ev, "frequency"),
          startDate: tag(ev, "start-date"),
          nextDue: tag(ev, "next-due"),
          isActive: tag(ev, "active") !== "false",
          notes: ev.content,
          createdAt: ev.created_at,
        };
      });
    } catch (e) {
      error.value = e;
    } finally {
      isLoading.value = false;
    }
  };

  const createSchedule = async (data: {
    plantId: string;
    activity: string;
    frequency: string;
    startDate: string;
    notes?: string;
  }) => {
    const id = `${data.plantId}:${data.activity}:${data.frequency}`;
    const nextDue = data.startDate;
    const tags: string[][] = [
      ["d", id],
      ["t", "gms-schedule"],
      ["p-ref", data.plantId],
      ["activity", data.activity],
      ["frequency", data.frequency],
      ["start-date", data.startDate],
      ["next-due", nextDue],
      ["active", "true"],
    ];

    const success = await publishOrQueue(
      GMS_KINDS.SCHEDULE,
      tags,
      data.notes || "",
    );

    if (success) {
      const plant = plants.value.find((p) => p.id === data.plantId);
      schedules.value.push({
        eventId: "",
        id,
        plantName: plant?.name,
        plot: plant?.plot,
        isActive: true,
        nextDue,
        createdAt: Math.floor(Date.now() / 1000),
        ...data,
      });
    }
    return success;
  };

  // ─────────────────────────────────────────────────────────────
  // 🌾  HARVESTS  (kind 31003)
  // ─────────────────────────────────────────────────────────────

  const loadHarvests = async () => {
    if (!user.value) return;
    isLoading.value = true;
    try {
      const events = await pool.querySync(RELAYS, {
        kinds: [GMS_KINDS.HARVEST],
        authors: [user.value.publicKey],
        "#t": ["gms-harvest"],
      });

      // Deduplicate by event.id since multiple relays can return the same event
      const map = new Map<string, any>();
      for (const ev of events) {
        if (!map.has(ev.id)) map.set(ev.id, ev);
      }

      harvests.value = [...map.values()].map((ev: any) => {
        const plant = plants.value.find((p) => p.id === tag(ev, "p-ref"));
        return {
          eventId: ev.id,
          id: tag(ev, "d"),
          plantId: tag(ev, "p-ref"),
          plantName: plant?.name,
          quantity: Number(tag(ev, "quantity")) || 0,
          unit: tag(ev, "unit"),
          date: tag(ev, "date"),
          revenue: Number(tag(ev, "revenue")) || 0,
          notes: ev.content,
          createdAt: ev.created_at,
        };
      });
    } catch (e) {
      error.value = e;
    } finally {
      isLoading.value = false;
    }
  };

  const createHarvest = async (data: {
    plantId: string;
    quantity: number;
    unit: string;
    date: string;
    notes?: string;
    revenue?: number;
  }) => {
    const id = crypto.randomUUID();
    const tags: string[][] = [
      ["d", id],
      ["t", "gms-harvest"],
      ["p-ref", data.plantId],
      ["quantity", String(data.quantity)],
      ["unit", data.unit],
      ["date", data.date],
    ];
    if (data.revenue) tags.push(["revenue", String(data.revenue)]);

    const success = await publishOrQueue(
      GMS_KINDS.HARVEST,
      tags,
      data.notes || "",
    );
    if (success) {
      const plant = plants.value.find((p) => p.id === data.plantId);
      harvests.value.unshift({
        eventId: "",
        id,
        plantName: plant?.name,
        createdAt: Math.floor(Date.now() / 1000),
        ...data,
      });
    }
    return success;
  };

  // ─────────────────────────────────────────────────────────────
  // 🚀  Load all GMS data (plants → care → schedules → harvests)
  // ─────────────────────────────────────────────────────────────
  const loadAll = async () => {
    await loadPlants();
    await Promise.all([loadCareLogs(), loadSchedules(), loadHarvests()]);
  };

  return {
    // state
    plants,
    careLogs,
    schedules,
    harvests,
    isLoading,
    error,
    isOnline,
    // computed
    totalPlants,
    activePlots,
    pendingCare,
    // plants
    loadPlants,
    createPlant,
    updatePlantStatus,
    // care logs
    loadCareLogs,
    createCareLog,
    // schedules
    loadSchedules,
    createSchedule,
    // harvests
    loadHarvests,
    createHarvest,
    // sync
    loadAll,
    syncOfflineQueue,
    getOfflineQueue,
  };
};

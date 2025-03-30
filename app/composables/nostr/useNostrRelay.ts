// composables/nostr/useNostrRelay.ts

import { ref } from "vue";
import type { Event } from "nostr-tools";

// Default relays
const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  // Uncomment these as needed
  "wss://yabu.me",
  // "wss://nos.lol",
  // "wss://nostr-pub.wellorder.net",
];

export const useNostrRelay = () => {
  const relays = ref<string[]>([...DEFAULT_RELAYS]);
  const isConnected = ref<boolean>(false);
  const error = ref<any>(null);

  const { $nostr } = useNuxtApp();
  const { pool } = $nostr;

  /**
   * Connect to all configured relays
   */
  const connect = async (customRelays?: string[]) => {
    if (customRelays) {
      relays.value = customRelays;
    }

    try {
      relays.value.forEach((url) => pool.ensureRelay(url));
      isConnected.value = true;
      return true;
    } catch (e) {
      error.value = e;
      isConnected.value = false;
      return false;
    }
  };

  /**
   * Add a new relay to the list
   */
  const addRelay = (url: string) => {
    if (!relays.value.includes(url)) {
      relays.value.push(url);
      try {
        pool.ensureRelay(url);
        return true;
      } catch (e) {
        error.value = e;
        return false;
      }
    }
    return true;
  };

  /**
   * Remove a relay from the list
   */
  const removeRelay = (url: string) => {
    const index = relays.value.indexOf(url);
    if (index !== -1) {
      relays.value.splice(index, 1);
      return true;
    }
    return true;
  };

  /**
   * Generic function to query events from relays
   */
  const queryEvents = async (
    filter: any,
    selectedRelays?: string[]
  ): Promise<Event[]> => {
    try {
      const useRelays = selectedRelays || relays.value;
      return await pool.querySync(useRelays, filter);
    } catch (e) {
      error.value = e;
      return [];
    }
  };

  /**
   * Subscribe to events from relays
   */
  const subscribeToEvents = (
    filter: any,
    callbacks: {
      onevent: (event: Event) => void;
      oneose?: () => void;
    },
    selectedRelays?: string[]
  ) => {
    try {
      const useRelays = selectedRelays || relays.value;
      return pool.subscribeMany(useRelays, [filter], callbacks);
    } catch (e) {
      error.value = e;
      return null;
    }
  };

  /**
   * Publish an event to relays
   */
  const publishEvent = async (event: Event, selectedRelays?: string[]) => {
    try {
      const useRelays = selectedRelays || relays.value;
      await Promise.any(pool.publish(useRelays, event));
      return true;
    } catch (e) {
      error.value = e;
      return false;
    }
  };

  return {
    relays,
    isConnected,
    error,
    connect,
    addRelay,
    removeRelay,
    queryEvents,
    subscribeToEvents,
    publishEvent,
    DEFAULT_RELAYS,
  };
};

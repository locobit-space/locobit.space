// composables/useNostr.ts

import { ref, onMounted } from "vue";
import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
} from "nostr-tools/pure";
import { SimplePool } from "nostr-tools/pool";
import { nip19 } from "nostr-tools";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils";

const RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://nostr-pub.wellorder.net",
  "wss://relay.snort.social",
];

type NostrUser = {
  privateKey: string; // hex string
  publicKey: string; // hex string
  nsec?: string; // optional NIP-19 encoded private key
  npub?: string; // optional NIP-19 encoded public key
};

export const useNostr = () => {
  const user = ref<NostrUser | null>(null);
  const notes = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<any>(null);

  const pool = new SimplePool();
  const latestTimestamp = ref(0);

  // --- Session Restore on Load ---
  onMounted(() => {
    if (import.meta.client) {
      const saved = localStorage.getItem("nostrUser");
      if (saved) {
        user.value = JSON.parse(saved);
      }
    }
  });

  // --- Create a new keypair ---
  const createUser = () => {
    const privateKeyBytes = generateSecretKey();
    const privateKeyHex = bytesToHex(privateKeyBytes);
    const publicKey = getPublicKey(privateKeyBytes);

    const nsec = nip19.nsecEncode(privateKeyBytes);
    const npub = nip19.npubEncode(publicKey);

    user.value = {
      privateKey: privateKeyHex,
      publicKey,
      nsec,
      npub,
    };

    if (import.meta.client) {
      localStorage.setItem("nostrUser", JSON.stringify(user.value));
    }

    return user.value;
  };

  // --- Setup user from private key (hex) ---
  const setupUser = (inputKey: string) => {
    inputKey = inputKey.trim();

    let privateKeyHex = "";

    if (inputKey.startsWith("nsec")) {
      try {
        const decoded = nip19.decode(inputKey);
        if (decoded.type !== "nsec") throw new Error("Invalid nsec key");

        // Convert Uint8Array to hex string
        privateKeyHex = bytesToHex(decoded.data as Uint8Array);
      } catch (e) {
        throw new Error("Failed to decode nsec key");
      }
    } else {
      // Validate raw hex key
      inputKey = inputKey.toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(inputKey)) {
        throw new Error(
          "Invalid private key format. Must be 64-character hex or valid nsec."
        );
      }
      privateKeyHex = inputKey;
    }

    const pubkey = getPublicKey(hexToBytes(privateKeyHex));

    user.value = {
      privateKey: privateKeyHex,
      publicKey: pubkey,
    };

    if (import.meta.client) {
      localStorage.setItem("nostrUser", JSON.stringify(user.value));
    }
  };

  // --- Connect to relays (optional for future expansion) ---
  const connect = async () => {
    try {
      RELAYS.forEach((url) => pool.ensureRelay(url));
    } catch (e) {
      error.value = e;
    }
  };

  // --- Post a note ---
  const postNote = async (content: string) => {
    if (!user.value) return false;
    isLoading.value = true;

    const eventTemplate = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content,
    };

    const signedEvent = finalizeEvent(
      eventTemplate,
      hexToBytes(user.value.privateKey)
    );
    try {
      await Promise.any(pool.publish(RELAYS, signedEvent));
      isLoading.value = false;
      return true;
    } catch (e) {
      error.value = e;
      isLoading.value = false;
      return false;
    }
  };

  // --- Load recent notes from pool ---
  const loadNotes = async () => {
    isLoading.value = true;
    notes.value = [];

    try {
      const sub = pool.subscribeMany(
        RELAYS,
        [
          {
            kinds: [1],
            limit: 20,
          },
        ],
        {
          onevent(event) {
            notes.value.push(event);
            notes.value.sort((a, b) => b.created_at - a.created_at);
          },
          oneose() {
            isLoading.value = false;
          },
        }
      );

      return sub;
    } catch (e) {
      error.value = e;
      isLoading.value = false;
    }
  };

  const loadNotesOnce = async () => {
    isLoading.value = true;
    notes.value = [];

    try {
      const events = await pool.querySync(RELAYS, {
        kinds: [1],
        limit: 20,
      });

      notes.value = events.sort((a, b) => b.created_at - a.created_at);
      latestTimestamp.value = notes.value[0]?.created_at ?? 0;
    } catch (e) {
      error.value = e;
    } finally {
      isLoading.value = false;
    }
  };

  const checkNewNotes = async () => {
    isLoading.value = true;

    const sub = pool.subscribeMany(
      RELAYS,
      [
        {
          kinds: [1],
          since: latestTimestamp.value + 1, // only newer events
        },
      ],
      {
        onevent(event) {
          if (event.created_at > latestTimestamp.value) {
            notes.value.unshift(event);
            notes.value.sort((a, b) => b.created_at - a.created_at);
            latestTimestamp.value = event.created_at;
          }
        },
        oneose() {
          isLoading.value = false;
          sub.close();
        },
      }
    );
  };

  // Define types for better code clarity
  type NostrProfile = {
    name?: string;
    display_name?: string;
    about?: string;
    picture?: string;
    nip05?: string;
    banner?: string;
    lud16?: string; // Lightning address
    website?: string;
    [key: string]: any; // For any additional profile fields
  };

  type UserInfo = {
    pubkey: string;
    name: string;
    display_name: string;
    about: string;
    picture: string;
    nip05: string;
    banner: string;
    lud16: string;
    website: string;
    lastUpdated: number | null;
    verified: boolean;
  };

  /**
   * Converts an npub to a hex pubkey or returns the original if already hex
   * @param key - npub or hex pubkey
   * @returns hex pubkey
   */
  const normalizeKey = (key: string): string => {
    if (key.startsWith("npub")) {
      try {
        const { data } = nip19.decode(key);
        return data as string;
      } catch (e) {
        throw new Error(`Invalid npub: ${key}`);
      }
    }
    // Assume it's already a hex pubkey if not npub
    return key;
  };

  /**
   * Fetches user profile information from Nostr relays
   * @param pubkey - The user's public key
   * @param timeout - Timeout in milliseconds (default: 5000ms)
   * @returns UserInfo object or null if not found
   */
  const getUserInfo = async (
    _pubkey: string,
    timeout: number = 5000
  ): Promise<UserInfo | null> => {
    // Create a pool if not provided

    try {
      // Set up a timeout promise
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Fetch timeout")), timeout);
      });

      // Convert npub to hex pubkey if needed
      const pubkey = normalizeKey(_pubkey);

      // Set up the fetch promise
      const fetchPromise = pool.get(RELAYS, {
        kinds: [0], // kind 0 = metadata
        authors: [pubkey],
      });

      // Race between fetch and timeout
      const event = await Promise.race([fetchPromise, timeoutPromise]);
      console.log(event);

      if (!event || !event.content) {
        console.log(`No profile data found for pubkey: ${pubkey}`);
        return null;
      }

      try {
        const profile = JSON.parse(event.content) as NostrProfile;

        // Check NIP-05 verification (this is a simplification, actual verification requires additional steps)
        const verified = !!profile.nip05;

        return {
          pubkey,
          name: profile.name || "",
          display_name: profile.display_name || profile.name || "",
          about: profile.about || "",
          picture: profile.picture || "",
          nip05: profile.nip05 || "",
          banner: profile.banner || "",
          lud16: profile.lud16 || "",
          website: profile.website || "",
          lastUpdated: event.created_at || null,
          verified,
        };
      } catch (parseError) {
        console.error("Failed to parse profile content:", parseError);
        return null;
      }
    } catch (e) {
      console.error("Failed to load user profile:", e);
      return null;
    }
  };

  return {
    user,
    notes,
    isLoading,
    error,
    latestTimestamp,
    getUserInfo,
    checkNewNotes,
    loadNotesOnce,
    createUser,
    setupUser,
    connect,
    postNote,
    loadNotes,
  };
};

// composables/useNostr.ts

import { ref, onMounted } from "vue";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { nip19 } from "nostr-tools";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils";
import type { NostrUser, UserInfo } from "~~/types";
import type { Event } from "nostr-tools";

const RELAYS = [
  "wss://yabu.me",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://nostr-pub.wellorder.net",
];

// const pool = new SimplePool();

export const useNostr = () => {
  const user = ref<NostrUser | null>(null);
  const notes = useState<Event[]>("notes", () => []);
  const isLoading = ref(false);
  const error = ref<any>(null);

  const { $nostr } = useNuxtApp();
  const { finalizeEvent, pool } = $nostr;

  const latestTimestamp = useState<number>("latestTimestamp", () => 0);
  const currentUserInfo = useState<UserInfo>("currentUserInfo");

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
      // user user list
      const items = JSON.parse(localStorage.getItem("userList") || "[]");
      items.push(user.value);
      localStorage.setItem("userList", JSON.stringify(items));
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

  const extractHashtags = (content: string): string[] => {
    // Regular expression to find hashtags
    const hashtagRegex = /#(\w+)/g;

    // Extract unique hashtags
    const hashtags = [
      ...new Set(
        Array.from(content.matchAll(hashtagRegex), (match) => match[1]!)
      ),
    ];

    return hashtags;
  };

  // --- Post a note ---
  const postNote = async (content: string) => {
    if (!user.value) return false;
    isLoading.value = true;

    // find # in content all exp: Hello #laostr #nostr #nostrdev
    // Extract hashtags from the content
    const contentHashtags = extractHashtags(content);
    const tagsArray = contentHashtags.map((hashtag) => ["t", hashtag]);

    const eventTemplate = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        // ['t', 'laostr']
        ...tagsArray,
      ],
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

  // Extend the loadNotesOnce function to support following filter
  const loadNotesOnce = async (
    options: {
      filter?: "for-you" | "following" | "hashtag";
      hashtag?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) => {
    isLoading.value = true;

    // Destructure options with default values
    const { filter = "for-you", hashtag, limit = 20, offset = 0 } = options;

    try {
      // Prepare filter query
      const filterQuery: any = {
        kinds: [1], // Regular notes
        limit,
      };

      // User's public key (replace with actual user key retrieval)
      const userPubkey = user.value?.publicKey;

      // Different filtering logic based on selected filter
      switch (filter) {
        case "following":
          if (!userPubkey) {
            throw new Error("User not logged in");
          }

          // Fetch user's follow list (kind 3 events)
          const followList = await fetchFollowList(userPubkey);

          // Filter notes from followed users
          filterQuery.authors = followList;
          break;

        case "hashtag":
          if (hashtag) {
            filterQuery["#t"] = [hashtag];
          }
          break;

        case "for-you":
        default:
          // No additional filtering for 'for you' feed
          break;
      }

      // Query events from relays
      const events = await pool.querySync(RELAYS, filterQuery);

      // Sort events by created_at timestamp (most recent first)
      const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);

      // Apply pagination
      const paginatedEvents = sortedEvents.slice(offset, offset + limit);

      // Merge with existing notes, avoiding duplicates
      const uniqueEvents = [
        ...paginatedEvents,
        ...notes.value.filter(
          (existingNote) =>
            !paginatedEvents.some((newNote) => newNote.id === existingNote.id)
        ),
      ];

      // Update notes and timestamp
      notes.value = uniqueEvents;
      latestTimestamp.value = notes.value[0]?.created_at ?? 0;
    } catch (e) {
      error.value = e;
    } finally {
      isLoading.value = false;
    }
  };

  // Helper function to fetch follow list
  const fetchFollowList = async (pubkey: string): Promise<string[]> => {
    try {
      // Fetch kind 3 events (contact list) for the user
      const contactListEvents = await $nostr.pool.querySync(RELAYS, {
        kinds: [3],
        authors: [pubkey],
        limit: 1, // Get the most recent contact list
      });

      // If no contact list found, return empty array
      if (contactListEvents.length === 0) return [];

      // Get the most recent contact list event
      const latestContactList = contactListEvents[0];
      if (!latestContactList) return [];

      // Extract followed pubkeys from tags
      const followedPubkeys = latestContactList.tags
        .filter((tag) => tag[0] === "p") // Filter person tags
        .map((tag) => tag[1]); // Extract pubkey

      return followedPubkeys as string[];
    } catch (error) {
      console.error("Failed to fetch follow list:", error);
      return [];
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

  // Utility: Normalize pubkey (npub or hex)
  const normalizeKey = (key: string): string => {
    key = key.trim().toLowerCase();

    if (key.startsWith("npub")) {
      try {
        const { data } = nip19.decode(key);
        return data as string;
      } catch {
        console.warn(`Invalid npub: ${key}`);
        return key;
      }
    }

    if (key.startsWith("0x")) key = key.slice(2);

    const hexRegex = /^[0-9a-f]{64}$/;
    if (hexRegex.test(key)) return key;

    throw new Error(`Invalid public key format: ${key}`);
  };

  // Utility: Convert hex pubkey to npub
  const hexToNpub = (hex: string): string => {
    try {
      return nip19.npubEncode(hex);
    } catch (e) {
      console.error("Failed to convert hex to npub:", e);
      return hex;
    }
  };

  // Main Function
  const getUserInfo = async (
    _pubkey: string,
    timeout: number = 10000,
    maxRelays: number = 10,
    debug: boolean = false
  ): Promise<UserInfo | null> => {
    const pubkey = normalizeKey(_pubkey);

    // Fetch from relays
    const fetchFromRelays = async (): Promise<any | null> => {
      const shuffledRelays = RELAYS.sort(() => 0.5 - Math.random()).slice(
        0,
        maxRelays
      );
      if (debug) console.log(`🔍 Querying relays:`, shuffledRelays);

      const fetchPromises = shuffledRelays.map(async (relay) => {
        try {
          const event = await pool.get([relay], {
            kinds: [0],
            authors: [pubkey],
          });
          return event || null;
        } catch (error) {
          if (debug) console.warn(`⚠️ Relay failed (${relay}):`, error);
          return null;
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      const successful = results
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => (r as PromiseFulfilledResult<any>).value);

      return successful[0] || null;
    };

    // Timeout mechanism
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("⏳ Fetch timeout")), timeout)
    );

    let event: any = null;

    try {
      event = await Promise.race([fetchFromRelays(), timeoutPromise]);
    } catch (err) {
      if (debug) console.error("🚨 Relay fetch error:", err);
    }

    // No data
    if (!event || !event.content) {
      console.log(`❌ No profile data found for pubkey: ${pubkey}`);
      return null;
    }

    // Parse profile JSON
    try {
      const profile = JSON.parse(event.content);
      const verified = !!profile.nip05; // Simplified NIP-05 verification

      const userInfo: UserInfo = {
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

      if (debug) console.log("✅ Loaded profile:", userInfo);
      return userInfo;
    } catch (parseError) {
      console.error("❌ Failed to parse profile JSON:", parseError);
      return null;
    }
  };

  const loadOlderNotes = async (
    options: {
      hashtag?: string;
      limit?: number;
    } = {}
  ) => {
    // If no notes, return
    if (notes.value.length === 0) return false;

    // Destructure options with default values
    const { hashtag, limit = 20 } = options;

    // Get the timestamp of the oldest note
    const oldestTimestamp =
      notes.value[notes.value.length - 1]?.created_at || 0;

    try {
      // Prepare filter query
      const filter: any = {
        kinds: [1],
        limit,
        until: oldestTimestamp - 1, // Fetch notes older than the oldest note
      };

      // Add hashtag filter if provided
      if (hashtag) {
        filter["#t"] = [hashtag];
      }

      isLoading.value = true;
      // Query for older events
      const olderEvents = await pool.querySync(RELAYS, filter);

      // Sort older events by creation time (oldest first)
      const sortedOlderEvents = olderEvents.sort(
        (a, b) => a.created_at - b.created_at
      );

      // Append older events to existing notes, avoiding duplicates
      const uniqueOlderEvents = sortedOlderEvents.filter(
        (newNote) =>
          !notes.value.some((existingNote) => existingNote.id === newNote.id)
      );

      // Update notes (append to the end)
      notes.value = [...notes.value, ...uniqueOlderEvents];

      // Return if any new notes were loaded
      return uniqueOlderEvents.length > 0;
    } catch (e) {
      error.value = e;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(async () => {
    if (user.value) {
      const data = await getUserInfo(user.value.publicKey);
      if (data) {
        currentUserInfo.value = data;
      }
    }
  });

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
    normalizeKey,
    loadOlderNotes,
    currentUserInfo,
    RELAYS,
  };
};

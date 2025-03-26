// composables/useNostr.ts

import { ref, onMounted } from "vue";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { nip19 } from "nostr-tools";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils";
import type { NostrUser, Note, UserInfo } from "~~/types";

const RELAYS = [
  'wss://yabu.me',
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://nostr-pub.wellorder.net",

];

// const pool = new SimplePool();

export const useNostr = () => {
  const user = ref<NostrUser | null>(null);
  const notes = useState<Note[]>("notes", () => [])
  const isLoading = ref(false);
  const error = ref<any>(null);

  const { $nostr } = useNuxtApp();
  const { finalizeEvent, pool } = $nostr;

  const latestTimestamp = ref(0);
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

  const loadNotesOnce = async () => {
    isLoading.value = true;
    // notes.value = [];

    try {
      const events = await pool.querySync(RELAYS, {
        kinds: [1],
        limit: 20,
      });

      const items = events.sort((a, b) => b.created_at - a.created_at);
      notes.value = [...items, ...notes.value];
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
    currentUserInfo,
    RELAYS,
  };
};

// composables/nostr/useNostrUser.ts

import { ref, onMounted } from "vue";

import type { NostrUser, UserInfo } from "~~/types";
import { useNostrRelay } from "./useNostrRelay";
import { useNostrStorage } from "./useNostrStorage";
import { useNostrKeys } from "./useNostrKeys";
import { nip19 } from "nostr-tools";
import { hexToBytes } from "@noble/ciphers/utils";

// Default options
const DEFAULT_OPTIONS = {
  timeout: 10000,
  maxRelays: 10,
};

export const useNostrUser = () => {
  const user = useState<NostrUser | null>("nostrUser", () => null);
  const currentUserInfo = useState<UserInfo>("currentUserInfo");
  const isLoading = useState<boolean>("isLoading", () => false);
  const error = ref<any>(null);

  // Import other composables
  const {
    normalizeKey,
    decodePrivateKey,
    getPublicKeyFromPrivate,
    createKeyPair,
  } = useNostrKeys();
  const { saveUser, loadUser, accounts, loadCurrentUser, loadAllAccounts } =
    useNostrStorage();
  const { queryEvents } = useNostrRelay();

  /**
   * Create a new user account
   */
  const createUser = () => {
    const newUser = createKeyPair();
    user.value = newUser;

    // Set up the user
    setupUser(newUser.privateKey);

    return newUser;
  };

  /**
   * Set up user from a private key
   */
  const setupUser = async (inputKey: string) => {
    try {
      const privateKeyHex = decodePrivateKey(inputKey);
      const pubkey = getPublicKeyFromPrivate(privateKeyHex);

      const nsec = nip19.nsecEncode(hexToBytes(privateKeyHex));
      const npub = nip19.npubEncode(pubkey);
      const userKey = {
        privateKey: privateKeyHex,
        publicKey: pubkey,
        nsec,
        npub,
      };

      let newUser: UserInfo = {
        pubkey,
        display_name: `Account ${accounts.value.length + 1}`,
        userKeys: userKey,
      };

      user.value = { ...userKey };

      if (import.meta.client) {
        // Check if user exists in localStorage
        const existingUser = loadUser(pubkey);

        if (existingUser) {
          currentUserInfo.value = existingUser;
          const data = await getUserInfo(pubkey);

          if (data) {
            currentUserInfo.value = {
              ...data,
              userKeys: userKey,
            };
          }
          saveUser(currentUserInfo.value);
        } else {
          // Fetch user info from relays
          currentUserInfo.value = newUser;

          const data = await getUserInfo(pubkey);

          if (data) {
            currentUserInfo.value = {
              ...data,
              userKeys: userKey,
            };
          }
          saveUser(currentUserInfo.value);
        }
      } else {
        currentUserInfo.value = newUser;
      }

      return true;
    } catch (e) {
      error.value = e;
      return false;
    }
  };

  /**
   * Get user profile information
   */
  const getUserInfo = async (
    _pubkey: string,
    timeout: number = DEFAULT_OPTIONS.timeout,
    maxRelays: number = DEFAULT_OPTIONS.maxRelays,
    debug: boolean = false
  ): Promise<UserInfo | null> => {
    const pubkey = normalizeKey(_pubkey);

    isLoading.value = true;

    try {
      // Query for user profile (kind 0)
      const events = await queryEvents({
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      });

      isLoading.value = false;

      if (!events || events.length === 0) {
        if (debug) console.log(`No profile data found for pubkey: ${pubkey}`);
        return null;
      }

      const event = events[0];

      // No data
      if (!event || !event.content) {
        if (debug) console.log(`Empty profile data for pubkey: ${pubkey}`);
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
    } catch (e) {
      isLoading.value = false;
      error.value = e;
      return null;
    }
  };

  /**
   * Get multiple user profiles at once
   */
  const getUserInfoBatch = async (
    pubkeys: string[]
  ): Promise<Record<string, UserInfo>> => {
    isLoading.value = true;

    try {
      // Normalize all pubkeys
      const normalizedPubkeys = pubkeys.map((pk) => normalizeKey(pk));

      // Query for user profiles (kind 0)
      const events = await queryEvents({
        kinds: [0],
        authors: normalizedPubkeys,
      });

      isLoading.value = false;

      const result: Record<string, UserInfo> = {};

      // Process all events and create user info objects
      for (const event of events) {
        try {
          const profile = JSON.parse(event.content);
          const pubkey = event.pubkey;
          const verified = !!profile.nip05;

          result[pubkey] = {
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
          console.error(
            `Failed to parse profile for ${event.pubkey}:`,
            parseError
          );
        }
      }

      return result;
    } catch (e) {
      isLoading.value = false;
      error.value = e;
      return {};
    }
  };

  /**
   * Fetch user's follow list
   */
  const fetchFollowList = async (pubkey: string): Promise<string[]> => {
    try {
      // Fetch kind 3 events (contact list) for the user
      const events = await queryEvents({
        kinds: [3],
        authors: [pubkey],
        limit: 1, // Get the most recent contact list
      });

      // If no contact list found, return empty array
      if (!events || events.length === 0) return [];

      // Get the most recent contact list event
      const latestContactList = events[0];
      if (!latestContactList) return [];

      // Extract followed pubkeys from tags
      return latestContactList.tags
        .filter((tag) => tag[0] === "p") // Filter person tags
        .map((tag) => tag[1]) as string[]; // Extract pubkey
    } catch (error) {
      console.error("Failed to fetch follow list:", error);
      return [];
    }
  };

  /**
   * Initialize the user from local storage
   */
  const initializeUser = () => {
    if (import.meta.client) {
      const { userInfo, user: savedUser } = loadCurrentUser();

      if (userInfo) {
        currentUserInfo.value = userInfo;
      }

      if (savedUser) {
        user.value = savedUser;
      }

      // Load all accounts
      loadAllAccounts();
    }
  };

  // Load user data on mount
  onMounted(() => {
    initializeUser();
  });

  return {
    user,
    currentUserInfo,
    isLoading,
    error,
    createUser,
    setupUser,
    getUserInfo,
    getUserInfoBatch,
    fetchFollowList,
    initializeUser,
  };
};

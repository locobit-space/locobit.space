// composables/nostr/useNostrStorage.ts

import { ref } from "vue";
import type { NostrUser, UserInfo } from "~~/types";

export const useNostrStorage = () => {
  const accounts = useState<UserInfo[]>("accounts", () => []);

  /**
   * Save user info to local storage
   */
  const saveUser = (userInfo: UserInfo) => {
    if (!import.meta.client) return;

    // Save user keys
    if (userInfo.userKeys) {
      localStorage.setItem("nostrUser", JSON.stringify(userInfo.userKeys));
    }

    // Save current user info
    localStorage.setItem("currentUserInfo", JSON.stringify(userInfo));

    // Update accounts list
    updateAccountsList(userInfo);
  };

  /**
   * Update accounts list in local storage
   */
  const updateAccountsList = (userInfo: UserInfo) => {
    if (!import.meta.client) return;

    const storedList: UserInfo[] = JSON.parse(
      localStorage.getItem("userList") || "[]"
    );

    const exists = storedList.find((item) => item.pubkey === userInfo.pubkey);

    if (!exists) {
      storedList.push({
        pubkey: userInfo.pubkey,
        display_name:
          userInfo.display_name || `Account ${storedList.length + 1}`,
        userKeys: userInfo.userKeys,
        name: userInfo.name || "",
      });

      localStorage.setItem("userList", JSON.stringify(storedList));
      accounts.value = storedList;
    }
  };

  /**
   * Load user info from local storage
   */
  const loadUser = (pubkey: string): UserInfo | null => {
    if (!import.meta.client) return null;

    const storedList = JSON.parse(localStorage.getItem("userList") || "[]");
    return storedList.find((item: UserInfo) => item.pubkey === pubkey) || null;
  };

  /**
   * Load current user from local storage
   */
  const loadCurrentUser = (): {
    userInfo: UserInfo | null;
    user: NostrUser | null;
  } => {
    if (!import.meta.client) return { userInfo: null, user: null };

    let userInfo = null;
    let user = null;

    const currentUserData = localStorage.getItem("currentUserInfo");
    if (currentUserData) {
      userInfo = JSON.parse(currentUserData);
    }

    const userData = localStorage.getItem("nostrUser");
    if (userData) {
      user = JSON.parse(userData);
    }

    return { userInfo, user };
  };

  /**
   * Load all accounts from local storage
   */
  const loadAllAccounts = (): UserInfo[] => {
    if (!import.meta.client) return [];

    const items = JSON.parse(localStorage.getItem("userList") || "[]");
    accounts.value = items;
    return items;
  };

  /**
   * Clear user data from local storage
   */
  const clearUserData = () => {
    if (!import.meta.client) return;

    localStorage.removeItem("nostrUser");
    localStorage.removeItem("currentUserInfo");
  };

  return {
    accounts,
    saveUser,
    loadUser,
    loadCurrentUser,
    loadAllAccounts,
    clearUserData,
  };
};

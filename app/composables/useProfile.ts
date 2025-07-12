import { hexToBytes } from "@noble/ciphers/utils";
import { finalizeEvent, type Event } from "nostr-tools/pure";

import type { UserInfo } from "~~/types";

export const useProfile = () => {
  const { publishEvent } = useNostrRelay();
  const { user } = useNostrUser();
  const { getUserInfoBatch } = useNostrUser();
  const profiles = useState<Record<string, UserInfo>>("profiles");

  async function fetchUserProfiles(pubkeys: string[]) {
    const _profiles = await getUserInfoBatch(pubkeys);
    profiles.value = {
      ...profiles.value,
      ..._profiles,
    };
  }

  async function updateProfile(data: UserInfo) {
    const pubkey = data.pubkey;

    const event: Event = {
      kind: 0,
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      content: JSON.stringify(data),
      id: "",
      sig: "",
      tags: [],
    };

    try {
      const signed = finalizeEvent(
        event,
        hexToBytes(`${user.value?.privateKey}`)
      );
      return await publishEvent(signed);
    } catch (error) {
      throw new Error(`[useProfile] Error updating profile: ${error}`);
    }
  }

  return {
    profiles,
    fetchUserProfiles,
    updateProfile,
  };
};

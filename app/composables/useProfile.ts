import type { UserInfo } from "~~/types";

export const useProfile = () => {
  const { getUserInfoBatch } = useNostrUser();
  const profiles = useState<Record<string, UserInfo>>("profiles");

  async function fetchUserProfiles(pubkeys: string[]) {
    const _profiles = await getUserInfoBatch(pubkeys);
    profiles.value = {
      ...profiles.value,
      ..._profiles,
    };
  }

  return {
    profiles,
    fetchUserProfiles,
  };
};

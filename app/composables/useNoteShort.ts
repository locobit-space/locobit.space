
import type { Event } from "nostr-tools";
import { mediaExtensions } from "~/lib";


export const useNoteShort = () => {
  const { $nostr } = useNuxtApp();
  const { pool } = $nostr;
  const { RELAYS } = useNostr();

  const videos  = useState<Event[]>("videos", () => []);
  const isLoading = ref(false);
  const error = ref(null);

  function loadFirstShort() {}
  function loadOldShort() {}
  function checkNewShort() {}

  return {

  }

};

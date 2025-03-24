import { defineNuxtPlugin } from "#app";
import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  verifyEvent,
} from "nostr-tools/pure";

import * as nip19 from "nostr-tools/nip19";
import { SimplePool, useWebSocketImplementation } from "nostr-tools/pool";

import WebSocket from "ws";

// Make it work in Node (only if running SSR or server-side)
if (import.meta.client === false) {
  useWebSocketImplementation(WebSocket);
}

export default defineNuxtPlugin(() => {
  const generateKeys = () => {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    const nsec = nip19.nsecEncode(sk);
    const npub = nip19.npubEncode(pk);
    return { sk, pk, nsec, npub };
  };

  const pool = new SimplePool();

  return {
    provide: {
      nostr: {
        generateKeys,
        finalizeEvent,
        verifyEvent,
        pool,
        nip19,
      },
    },
  };
});

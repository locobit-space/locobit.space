// composables/nostr/useNostrKeys.ts

import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { nip19 } from "nostr-tools";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils";
import type { NostrUser } from "~~/types";

export const useNostrKeys = () => {
  /**
   * Create a new Nostr keypair
   */
  const createKeyPair = (): NostrUser => {
    const privateKeyBytes = generateSecretKey();
    const privateKeyHex = bytesToHex(privateKeyBytes);
    const publicKey = getPublicKey(privateKeyBytes);

    const nsec = nip19.nsecEncode(privateKeyBytes);
    const npub = nip19.npubEncode(publicKey);

    return {
      privateKey: privateKeyHex,
      publicKey,
      nsec,
      npub,
    };
  };

  /**
   * Decode private key from various formats (nsec or hex)
   */
  const decodePrivateKey = (inputKey: string): string => {
    const trimmedKey = inputKey.trim();

    if (trimmedKey.startsWith("nsec")) {
      try {
        const decoded = nip19.decode(trimmedKey);
        if (decoded.type !== "nsec") throw new Error("Invalid nsec key");
        return bytesToHex(decoded.data as Uint8Array);
      } catch {
        throw new Error("Failed to decode nsec key");
      }
    }

    const hexKey = trimmedKey.toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(hexKey)) {
      throw new Error(
        "Invalid private key format. Must be 64-character hex or valid nsec."
      );
    }

    return hexKey;
  };

  /**
   * Normalize pubkey (convert from npub to hex if needed)
   */
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

  /**
   * Convert hex pubkey to npub
   */
  const hexToNpub = (hex: string): string => {
    try {
      return nip19.npubEncode(hex);
    } catch (e) {
      console.error("Failed to convert hex to npub:", e);
      return hex;
    }
  };

  /**
   * Get public key from private key
   */
  const getPublicKeyFromPrivate = (privateKeyHex: string): string => {
    return getPublicKey(hexToBytes(privateKeyHex));
  };

  return {
    createKeyPair,
    decodePrivateKey,
    normalizeKey,
    hexToNpub,
    getPublicKeyFromPrivate,
  };
};
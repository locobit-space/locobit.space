export type NostrUser = {
  privateKey: string; // hex string
  publicKey: string; // hex string
  nsec?: string; // optional NIP-19 encoded private key
  npub?: string; // optional NIP-19 encoded public key
};


  export type UserInfo = {
    pubkey: string;
    name: string;
    display_name: string;
    about?: string;
    picture?: string;
    nip05?: string;
    banner?: string;
    lud16?: string; // Lightning address
    website?: string;
    lastUpdated?: number | null;
    verified?: boolean;
    [key: string]: any; // For any additional profile fields
  };
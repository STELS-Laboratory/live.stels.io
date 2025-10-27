export interface EncryptResult {
  iv: Uint8Array;
  encryptedData: Uint8Array;
}

export interface KeyDerivationResult {
  key: Uint8Array;
  salt: Uint8Array;
}

export interface PasswordEncryptionResult {
  encryptedData: Uint8Array;
  iv: Uint8Array;
  salt: Uint8Array;
}

export const AES_GCM_IV_SIZE = 12;
export const SALT_SIZE = 32;
export const DEFAULT_PBKDF2_ITERATIONS = 100000;
export const MIN_PBKDF2_ITERATIONS = 10000;
export const MIN_KEY_LENGTH = 16;
export const MAX_KEY_LENGTH = 64;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 64;

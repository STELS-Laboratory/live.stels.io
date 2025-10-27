export type {
  EncryptResult,
  KeyDerivationResult,
  PasswordEncryptionResult,
} from "./types.ts";

export {
  AES_GCM_IV_SIZE,
  DEFAULT_PBKDF2_ITERATIONS,
  MAX_KEY_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_KEY_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_PBKDF2_ITERATIONS,
  SALT_SIZE,
} from "./types.ts";

export {
  generateRandomString,
  hexToUint8Array,
  isValidHex,
  strToUint8Array,
  uint8ArrayToHex,
  uint8ArrayToStr,
} from "./encoding.ts";

export { generateSHA256Hash } from "./hash.ts";

export { decrypt, encrypt } from "./aes.ts";

export {
  decryptWithPassword,
  deriveKey,
  encryptWithPassword,
} from "./pbkdf2.ts";

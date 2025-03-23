import forge from 'node-forge';
import pkg from "js-sha3"

const {sha3_256, sha3_384} = pkg

class RequestEncryption {
  private static keySize = 32;
  
  /**
   * Encrypts a message using AES-CBC with a shared key derived from ECDH
   * @param message The message to encrypt
   * @param sharedKey The shared key from ECDH
   * @returns {Promise<{encryptedMessage: string, iv: string}>}
   */
  static async encryptMessage(message: string, sharedKey: string): Promise<{encryptedMessage: string, iv: string}> {
    if (!message || !sharedKey) {
      throw new Error('Message and shared key are required for encryption');
    }

    const iv = forge.random.getBytesSync(16);
    const key = sharedKey.substring(0, RequestEncryption.keySize);
    
    const cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({ iv });
    cipher.update(forge.util.createBuffer(message, 'utf8'));
    cipher.finish();

    return {
      encryptedMessage: forge.util.encode64(cipher.output.getBytes()),
      iv: forge.util.encode64(iv)
    };
  }

  /**
   * Decrypts a message using AES-CBC with a shared key derived from ECDH
   * @param encryptedMessage The encrypted message
   * @param sharedKey The shared key from ECDH
   * @param iv The initialization vector
   * @returns {Promise<string>}
   */
  static async decryptMessage(encryptedMessage: string, sharedKey: string, iv: string): Promise<string> {
    if (!encryptedMessage || !sharedKey || !iv) {
      throw new Error('Encrypted message, shared key, and IV are required for decryption');
    }

    const key = sharedKey.substring(0, RequestEncryption.keySize);
    const decipher = forge.cipher.createDecipher('AES-CBC', key);
    
    // Decode the IV and encrypted message
    const decipheredIV = forge.util.decode64(iv);
    const encryptedBuffer = forge.util.createBuffer(forge.util.decode64(encryptedMessage), 'raw');

    decipher.start({ iv: decipheredIV });
    decipher.update(encryptedBuffer);
    const result = decipher.finish();

    if (result) {
      return decipher.output.toString();
    } else {
      throw new Error('Failed to decrypt message');
    }
  }
}

export default RequestEncryption;

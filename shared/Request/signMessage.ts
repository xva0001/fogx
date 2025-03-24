import pkg from "js-sha3"

const {sha3_256, sha3_384} = pkg

import EC from "elliptic"

/**
 * Provides functionality for signing and verifying messages using Ed25519 elliptic curve cryptography.
 * @module SignMessage
 */
class SignMessage{
     /**
     * Signs a message using a private key.
     * @param {string} prikey - The private key in hexadecimal format.
     * @param {string} message - The message to be signed.
     * @returns {Promise<{mess: string, hash: string}>} 
     *   A promise that resolves to an object containing:
     *   - mess: The signed message in hexadecimal format
     *   - hash: The SHA-3-256 hash of the message
     * @throws {Error} If key pair creation fails
     */
    static async sign(prikey:string,message:string): Promise<{mess : string,hash:string}>{

        let key = prikey
        let keypair = new EC.ec("ed25519").keyFromPrivate(prikey,"hex")
        let hash = sha3_256(message)

        return {mess:keypair.sign(hash).toDER('hex'),hash:hash}
    }

    /**
     * Verifies a signed message using a public key.
     * @param {string} pubkey - The public key in hexadecimal format.
     * @param {string} signedMsg - The signed message to verify.
     * @param {string} hash - The original hash of the message.
     * @returns {Promise<boolean>} 
     *   A promise that resolves to true if the signature is valid, false otherwise
     */
    static verify(pubkey:string,signedMsg:string,hash:string) : boolean{
        let key = new EC.ec("ed25519").keyFromPublic(pubkey, 'hex' )
        let isValid  = true ;
        try {
            isValid = key.verify(hash,signedMsg)
            console.log("from sign msg",isValid);
            
        } catch (error) {
            console.log(error);
            isValid = false
        }
        return isValid
    }
}

export default SignMessage
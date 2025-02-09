import { z } from "zod";
import { defineEventHandler, readBody } from "h3";
import EC  from "elliptic";
import sha3 from "js-sha3";



const signObjSchema = z.object({
  sign: z.string().regex(/^[a-fA-F0-9]+$/),
  org: z.string()
});

export default defineEventHandler(async (event) => {
  // Load public key from environment variable
  const ec = new EC.ec("ed25519"); // Ensure curve matches your keypair
  const publicKeyHex = process.env.ECDSA_SIGN_PUBLIC_KEY!;
  if (!publicKeyHex) {
    throw new Error("Missing ECDSA public key in environment variables.");
  }

  // Parse and validate request body
  const body = await readBody(event);
  const result = signObjSchema.safeParse(body);

  if (!result.success) {
    return createError({
        status : 400,
        message : "request invaild",
        stack:""
    }).toJSON()
  }

  const { sign, org } = result.data;

  // Hash the message (org) using SHA3-384
  const hashMessage = sha3.sha3_384(org);

  try {
    const keyv = ec.keyFromPublic(publicKeyHex, "hex");

    // Verify signature
    const isValid = keyv.verify(hashMessage, sign);

    return {
      success: true,
      verificationResult: isValid
    };
  } catch (error) {
    return {
      success: false,
      error: "Signature verification failed."
    };
  }
});

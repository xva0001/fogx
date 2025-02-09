import { z } from "zod";
import { defineEventHandler, readBody, createError } from "h3";
import EC from "elliptic";

const signObjSchema = z.object({
  sign: z.string().regex(/^[a-fA-F0-9]+$/), // Signature in hexadecimal format
  hashedMessage: z.string().regex(/^[a-fA-F0-9]{64}$/) // SHA3-384 produces 96-character hex
});

export default defineEventHandler(async (event) => {
  // Load public key from environment variables
  const ec = new EC.ec("ed25519"); // Ensure curve matches your keys
  const publicKeyHex = process.env.ECDSA_SIGN_PUBLIC_KEY;
  console.log(publicKeyHex);
  
  if (!publicKeyHex) {
    throw createError({
      status: 500,
      message: "Missing ECDSA public key in environment variables."
    });
  }

  // Parse and validate request body
  const body = await readBody(event);
  const result = signObjSchema.safeParse(body);

  if (!result.success) {
    return createError({
      status: 400,
      message: "Invalid request format.",
      stack: ""
    }).toJSON();
  }

  const { sign, hashedMessage } = result.data;

  console.log(hashedMessage);
  
  try {
    const keyv = ec.keyFromPublic(publicKeyHex, "hex");

    // Directly verify the hashed message
    const isValid = keyv.verify(hashedMessage, sign);

    console.log(isValid);
    

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

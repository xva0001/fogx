import { z } from "zod";
const regex_sha256 = /^[a-fA-F0-9$]{64}$/;
const regex_sha384 = /^[a-fA-F0-9$]{96}$/;

const IPasswordUpdateRequestSchema = z.object({
    old_hash3_256_password: z.string().regex(regex_sha256, "Invalid SHA3-256 hash format"),
    old_hash384_password: z.string().regex(regex_sha384, "Invalid SHA3-384 hash format"),
    new_hash3_256_password: z.string().regex(regex_sha256, "Invalid SHA3-256 hash format"),
    new_hash384_password: z.string().regex(regex_sha384, "Invalid SHA3-384 hash format"),
    CUUID: z.string().uuid("Invalid CUUID format"),
    jwt: z.string(),
    paseto: z.string()
});
export default IPasswordUpdateRequestSchema
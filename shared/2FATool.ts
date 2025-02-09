
import forge from "node-forge"
import base32 from "hi-base32"

interface GenerateKeyOptions {
    length?: number;
}

interface TOTPOptions {
    length?: number;
    drift?: number;
    beforeDrift?: number;
    afterDrift?: number;
}

const generateBackupCodes = (count: number = 5): string[] => {
    return Array.from({ length: count }, () => {
        const rawCode = Math.random().toString(36).slice(2, 18).toUpperCase();
        return rawCode.match(/.{1,4}/g)?.join('-') || rawCode; // Break into 4-character chunks
    });
};


const OTPObj:any ={}

OTPObj.generateTOTP = (key: string, counter: number, opts: TOTPOptions = {}): string => {
    const { length = 6 } = opts;

    // Convert counter to 8-byte array (Big-Endian)
    const counterBytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
        counterBytes[i] = counter & 0xff;
        counter = counter >> 8;
    }

    // Create HMAC object
    const hmac = forge.hmac.create();
    hmac.start('sha1', forge.util.createBuffer(key));
    hmac.update(forge.util.createBuffer(counterBytes).bytes());
    const hash = forge.util.bytesToHex(hmac.digest().getBytes());

    // Extract offset from hash's last byte
    const offset = parseInt(hash.slice(-1), 16) & 0x0f;

    // Extract 4 bytes starting from offset and compute binary value
    const binary = (parseInt(hash.substring(offset * 2, offset * 2 + 8), 16) & 0x7fffffff) >>> 0;

    // Convert binary value to a decimal string with the specified length
    const code = (binary % Math.pow(10, length)).toString().padStart(length, '0');

    return code;
};


OTPObj.validator = (key: string, code: string, counter: number, opts: TOTPOptions = {}): boolean => {
    const { drift = 0, beforeDrift = drift / 2, afterDrift = drift / 2 } = opts;

    // 允許的計數器範圍
    for (let i = counter - beforeDrift; i <= counter + afterDrift; i++) {
        if (OTPObj.generateTOTP(key, i, opts) === code) {
            return true; // 驗證成功
        }
    }
    return false; // 驗證失敗
}

OTPObj.generateKey = ({ length = 64 }: GenerateKeyOptions = {}): string => {
    const padding = 3 - (length * 3 % 4);
    const requiredBytes = Math.ceil(length / 4) * 3 + padding;
    const bytes = forge.random.getBytesSync(requiredBytes);
    const key = forge.util.encode64(bytes).replace(/\+/g, '-').replace(/\//g, '_').slice(0, length);
    return key;
};

OTPObj.generateBackupCodes = generateBackupCodes;

export interface IFactorCheckTool{
    generateTOTP: (key: string, counter: number, opts?: TOTPOptions) => string; // 生成 TOTP 的方法
    validator: (key: string, code: string, counter: number, opts?: TOTPOptions) => boolean; // 验证 TOTP 的方法
    generateKey: (opts?: GenerateKeyOptions) => string; // 生成密钥的函数
    generateBackupCodes:(count?:number)=>string[];

}
export  const SecFATool = ():IFactorCheckTool=>{return OTPObj};
//we use lib, so that is @deprecated


//@deprecated



// @preserve author Alexander Stetsyuk
// @preserve author Glenn Rempe <glenn@rempe.us>
// @license MIT

/*jslint passfail: false, bitwise: true, nomen: true, plusplus: true, todo: false, maxerr: 1000 */
/*global define, require, module, exports, window, Uint32Array */

// eslint : http://eslint.org/docs/configuring/
/*eslint-env node, browser, jasmine */
/*eslint no-underscore-dangle:0 */

// UMD (Universal Module Definition)
// Uses Node, AMD or browser globals to create a module. This module creates
// a global even when AMD is used. This is useful if you have some scripts
// that are loaded by an AMD loader, but they still want access to globals.
// See : https://github.com/umdjs/umd
// See : https://github.com/umdjs/umd/blob/master/returnExportsGlobal.js
//

import forge from "node-forge";

// 配置物件的型別

interface Config {
    bits: number;
    maxShares: number;
    logs: number[];
    exps: number[];
    size: number;
    radix: number;
}

interface Share {
    x: number;
    y: number;
}

const config_re: Config = {
    bits: 8, // 假設每段是 8 位
    maxShares: 255, // 假設有限域的大小
    logs: [], // 需初始化為適當的對數表
    exps: [], // 需初始化為適當的指數表
    size: 256, // 有限域大小
    radix: 16 // 進制
};


type UserConfig = Partial<{
    bits: number;  // 用戶可自定義的配置屬性
    radix: number;
}>;

//https://www.ecice06.com/CN/10.3969/j.issn.1000-3428.2008.15.052



export const settings = {
    bits: 8,
    radix: 16,
    minBits: 3,
    maxBits: 20, // this permits 1,048,575 shares,
    //  though going this high is NOT recommended in JS!
    bytesPerChar: 2,
    maxBytesPerChar: 6, // Math.pow(256,7) > Math.pow(2,53)


    // Primitive polynomials (in decimal form) for Galois Fields GF(2^n), for 2 <= n <= 30
    // The index of each term in the array corresponds to the n for that polynomial
    // i.e. to get the polynomial for n=16, use primitivePolynomials[16]
    primitivePolynomials: [
        null, null, 1, 3, 3,
        5, 3, 3, 29, 17,
        9, 5, 83, 27, 43,
        3, 45, 9, 39, 39,
        9, 5, 3, 33, 27,
        9, 71, 39, 9, 5, 83
    ]
}


export class Secrets {

    // 產生對數表和指數表
    static initTables() {
        // 產生對數表和指數表
        let x = 1;
        for (let i = 0; i < config_re.maxShares; i++) {
            config_re.exps[i] = x;
            config_re.logs[x] = i;
            x = x << 1;
            if (x >= config_re.maxShares) {
                x = x ^ config_re.maxShares;
                x = x ^ 283;
            }
        }
    }

    // 將字串轉換為數字陣列
    static strToNumArray(str: string): number[] {
        const numArray: number[] = [];
        for (let i = 0; i < str.length; i++) {
            numArray.push(str.charCodeAt(i));
        }
        return numArray;
    }

    // 將數字陣列轉換為字串
    static numArrayToStr(numArray: number[]): string {
        let str = '';
        for (let i = 0; i < numArray.length; i++) {
            str += String.fromCharCode(numArray[i]);
        }
        return str;
    }

    // 將數字陣列轉換為 16 進位字串
    static numArrayToHex(numArray: number[]): string {
        let hex = '';
        for (let i = 0; i < numArray.length; i++) {
            hex += ('0' + numArray[i].toString(16)).slice(-2);
        }
        return hex;
    }

    // 將 16 進位字串轉換為數字陣列
    static hexToNumArray(hex: string): number[] {
        const numArray: number[] = [];
        for (let i = 0; i < hex.length; i += 2) {
            numArray.push(parseInt(hex.substr(i, 2), 16));
        }
        return numArray;
    }

    // 將字串轉換為 16 進位字串
    static strToHex(str: string): string {
        return this.numArrayToHex(this.strToNumArray(str));
    }

    static padLeft(str: string, multipleOfBits: number): string {
        let preGenPadding = new Array(1024).join("0")
        if (multipleOfBits === 0 || multipleOfBits === 1) {
            return str; // 如果倍數為 0 或 1，直接返回
        }

        if (multipleOfBits > 1024) {
            throw new Error("Padding must be multiples of no larger than 1024 bits.");
        }

        multipleOfBits = multipleOfBits || settings.bits; // 使用預設位數

        if (str) {
            const missing = str.length % multipleOfBits; // 計算需要補零的位數
            if (missing) {
                return (preGenPadding + str).slice(-(multipleOfBits - missing + str.length));
            }
        }

        return str; // 如果不需要補零，返回原始字串
    }

    static hex2bin(str: string): string {
        return str.split('').reverse().map(char => {
            const num = parseInt(char, 16);
            if (isNaN(num)) {
                throw new Error("Invalid hex character.");
            }
            return num.toString(2).padStart(4, '0');
        }).reverse().join('');
    }

    static bin2hex(str: string): string {
        str = str.padStart(Math.ceil(str.length / 4) * 4, '0');
        let hex = '';
        for (let i = 0; i < str.length; i += 4) {
            const num = parseInt(str.slice(i, i + 4), 2);
            if (isNaN(num)) {
                throw new Error("Invalid binary character.");
            }
            hex += num.toString(16);
        }
        return hex;
    }
    static getRNG(bits: number = settings.bits, arr?: number[], radix: number = settings.radix, size: number = 4): string {
        // 計算所需的位元組數
        let bytes = Math.ceil(bits / 8);

        // 初始化隨機字串結果
        let str = "";

        // 使用 forge 庫生成隨機位元組
        let buf = forge.random.getBytesSync(bytes);

        // 將位元組轉換為指定進制的字串
        for (let i = 0; i < buf.length; i++) {
            // 將字節轉換為整數值
            let value = buf.charCodeAt(i);

            // 如果有 `arr`，根據數值選擇字符
            if (arr && arr.length > 0) {
                str += arr[value % arr.length];
            } else {
                // 否則根據指定進制轉換
                str += value.toString(radix).padStart(size, '0'); // 確保固定長度
            }
        }
        // 返回生成的隨機字串
        return str.slice(0, Math.ceil(bits / (Math.log2(radix)))); // 裁剪到所需長度
    }


    static splitNumStringToIntArray(str: string, padLength?: number): number[] {
        const parts: number[] = [];

        // 如果有 padLength，先對字串進行填充
        if (padLength) {
            str = this.padLeft(str, padLength);
        }

        // 從尾部開始按 config.bits 切割
        for (let i = str.length; i > settings.bits; i -= settings.bits) {
            const segment = str.slice(i - settings.bits, i);
            parts.push(parseInt(segment, 2)); // 將二進位子字串轉換為整數
        }

        // 處理剩餘不足 config.bits 的部分
        if (str.length > 0) {
            parts.push(parseInt(str.slice(0, str.length), 2));
        }

        return parts;
    }

    // Horner 方法計算多項式值
    static horner(x: number, coeffs: number[]): number {
        const logx = config_re.logs[x]; // 取 x 的對數值
        let fx = 0;

        // 從高次項到低次項計算
        for (let i = coeffs.length - 1; i >= 0; i--) {
            if (fx !== 0) {
                fx =
                    config_re.exps[(logx + config_re.logs[fx]) % config_re.maxShares] ^
                    coeffs[i];
            } else {
                fx = coeffs[i];
            }
        }

        return fx;
    }


    // Evaluate the Lagrange interpolation polynomial at x = `at`
    // using x and y Arrays that are of the same length, with
    // corresponding elements constituting points on the polynomial.
    //拉格朗日插值多項式
    static lagrange(at: number, x: number[], y: number[], config: Config): number {
        let sum = 0; // 插值多项式的结果
        const len = x.length;

        for (let i = 0; i < len; i++) {
            // 如果插值点刚好等于 x[i]，直接返回 y[i]
            if (x[i] === at) {
                return y[i];
            }

            // 跳过无效的 y[i]
            if (y[i] === 0 || !config.logs[y[i]]) continue;

            let product = config.logs[y[i]]; // 初始化 product 为 log(y[i])
            for (let j = 0; j < len; j++) {
                if (i === j) continue; // 跳过自己

                const atXorXj = at ^ x[j];
                const xiXorXj = x[i] ^ x[j];

                // 处理特殊情况：分母或分子为 0
                if (atXorXj === 0 || xiXorXj === 0) {
                    product = -1;
                    break;
                }

                product = (product + config.logs[atXorXj] - config.logs[xiXorXj] + config.maxShares) % config.maxShares;
            }

            // 如果未发生特殊情况，累积结果
            if (product !== -1) {
                sum ^= config.exps[product];
            }
        }

        return sum;
    }



    static getShares(secret: number, numShares: number, threshold: number, config: { bits: number, rng: (bits: number) => string }): Share[] {
        const shares: Share[] = [];
        const coeffs: number[] = [secret];

        // 隨機生成多項式的其他係數
        for (let i = 1; i < threshold; i++) {
            coeffs[i] = parseInt(config.rng(config.bits), 2); // 生成隨機係數
        }

        // 計算每個共享值 (x, y)
        for (let i = 1; i <= numShares; i++) {
            shares.push({
                x: i,
                y: this.horner(i, coeffs) // 使用霍納法則計算 P(x)
            });
        }

        return shares;
    }



    static constructPublicShareString(bits: number, id: number, data: string, config: { radix: number }): string {
        // 驗證並解析參數
        const parsedBits = parseInt(bits.toString(), 10) || settings.bits;
        const parsedId = parseInt(id.toString(), config.radix);
        const bitsBase36 = parsedBits.toString(36).toUpperCase();
        const idMax = (1 << parsedBits) - 1; // 2^bits - 1
        const idPaddingLen = idMax.toString(config.radix).length;
        const idHex = this.padLeft(parsedId.toString(config.radix), idPaddingLen);

        // 驗證 ID 的範圍
        if (!Number.isInteger(parsedId) || parsedId < 1 || parsedId > idMax) {
            throw new Error(`Share id must be an integer between 1 and ${idMax}, inclusive.`);
        }

        // 拼接共享字符串
        return bitsBase36 + idHex + data;
    }

    //--------------------------------end of static--------------------------------------------------------------------------------------------

    //rng : string;
    bits: number = settings.bits;
    radix: number = settings.radix;
    minBits: number = settings.minBits;
    maxBits: number = settings.maxBits;
    private config: Config;
    private rng: () => string;

    constructor(userConfig: UserConfig = {}) {
        const { bits, radix, minBits, maxBits, primitivePolynomials } = settings;

        // 構造配置，使用默認值，允許用戶自定義部分配置
        this.config = {
            bits: userConfig.bits || bits,
            radix: userConfig.radix || radix,
            size: Math.pow(2, userConfig.bits || bits),
            maxShares: Math.pow(2, userConfig.bits || bits) - 1,
            logs: [],
            exps: []
        };

        // 默認隨機數生成器
        this.rng = () => Math.random().toString(2).substring(2, 2 + this.config.bits);

        // 初始化多項式和表
        this.init();
    }

    /**
     * 初始化方法，構造對數表和指數表
     */
    private init(): void {
        const { bits, size } = this.config;
        const { primitivePolynomials } = settings;

        // 检查位宽合法性
        if (bits < 3 || bits > 20) {
            throw new Error(`Bits must be between 3 and 20.`);
        }

        const primitive = primitivePolynomials[bits];
        if (!primitive) {
            throw new Error(`No primitive polynomial found for bits=${bits}.`);
        }

        // 初始化 logs 和 exps
        const logs: number[] = new Array(size).fill(-1); // 默认值为 -1
        const exps: number[] = new Array(size);

        let x = 1; // 初始值为 1
        for (let i = 0; i < size - 1; i++) {
            // 检查 x 是否重复或超出范围
            if (logs[x] !== -1) {
                throw new Error(`Duplicate x value: ${x} at step ${i}`);
            }
            if (x < 0 || x >= size) {
                throw new Error(`Invalid x value: ${x} at step ${i}`);
            }

            exps[i] = x; // 填充指数表
            logs[x] = i; // 填充对数表

            // 更新 x，左移并归约
            x = (x << 1)
            if (x >= size) {
                x = x ^ primitive // Bitwise XOR assignment
                x = x & config_re.maxShares // Bitwise AND assignment
            }
        }

        // 验证 logs 和 exps 的双射关系
        for (let i = 0; i < size - 1; i++) {
            if (logs[exps[i]] !== i) {
                throw new Error(`Mismatch in logs and exps at index ${i}`);
            }
        }

        // 将 logs 和 exps 表赋值到配置中
        this.config.logs = logs;
        this.config.exps = exps;

        console.log("Exps length:", exps.length, "Logs length:", logs.length);
    }



    /**
     * 設置隨機數生成器
     * @param rng 隨機數生成器函數
     */
    setRNG(rng?: () => string): void {
        this.rng = rng || (() => Math.random().toString(2).substring(2, 2 + this.config.bits));
    }

    /**
     * 獲取當前配置
     */
    getConfig(): Config {
        return this.config;
    }


    private padLeft(input: string, length: number = this.config.bits): string {
        return input.padStart(length, "0");
    }
    private splitNumStringToIntArray(str: string, padLength: number): number[] {
        var parts = [],
            i

        if (padLength) {
            str = this.padLeft(str, padLength)
        }

        for (i = str.length; i > settings.bits; i -= settings.bits) {
            parts.push(parseInt(str.slice(i - settings.bits, i), 2))
        }

        parts.push(parseInt(str.slice(0, i), 2))

        return parts
    }

    /**
 * Divides a `secret` string into `numShares` shares, requiring `threshold` shares to reconstruct.
 * Optionally pads the secret to a multiple of `padLength`.
 */
    share(secret: string, numShares: number, threshold: number, padLength: number = 128): string[] {
        if (typeof secret !== "string") {
            throw new Error("Secret must be a string.");
        }

        if (!Number.isInteger(numShares) || numShares < 2 || numShares > this.config.maxShares) {
            const neededBits = Math.ceil(Math.log(numShares + 1) / Math.LN2);
            throw new Error(
                `Number of shares must be an integer between 2 and ${this.config.maxShares}. To create ${numShares} shares, use at least ${neededBits} bits.`
            );
        }

        if (!Number.isInteger(threshold) || threshold < 2 || threshold > numShares) {
            throw new Error(
                `Threshold must be an integer between 2 and ${numShares}.`
            );
        }

        if (!Number.isInteger(padLength) || padLength < 0 || padLength > 1024) {
            throw new Error("Zero-pad length must be an integer between 0 and 1024.");
        }

        // Prepend a marker to preserve leading zeros
        let binarySecret = "1" + this.hex2bin(secret);

        // Split the binary secret into chunks of `padLength`
        const secretChunks = this.splitNumStringToIntArray(binarySecret, padLength);

        const x: string[] = new Array(numShares);
        const y: string[] = new Array(numShares);

        // Generate sub-shares for each chunk
        for (const chunk of secretChunks) {
            // Use the static `getShares` method from Secrets
            const subShares = Secrets.getShares(chunk, numShares, threshold, { bits: this.config.bits, rng: this.rng });
            for (let j = 0; j < numShares; j++) {
                x[j] = x[j] || subShares[j].x.toString(this.config.radix);
                y[j] = this.padLeft(subShares[j].y.toString(2)) + (y[j] || "");
            }
        }

        // Construct public share strings
        return x.map((xVal, i) =>
            this.constructPublicShareString(this.config.bits, xVal, this.bin2hex(y[i]))
        );

    }


    private constructPublicShareString(bits: number, id: string, data: string): string {
        return Secrets.constructPublicShareString(bits, parseInt(id), data, this.config);
    }
    private hex2bin(str: string): string {
        return Secrets.hex2bin(str);
    }
    private bin2hex(str: string): string {
        return Secrets.bin2hex(str);
    }

    extractShareComponents(share: string): { bits: number; id: number; data: string } {

        // Extract the bits from the first character of the share (Base 36)
        const bits = parseInt(share.charAt(0), 36);
        if (!Number.isInteger(bits) || bits < settings.minBits || bits > settings.maxBits) {
            throw new Error(
                `Invalid share: Number of bits must be an integer between ${settings.minBits} and ${settings.maxBits}, inclusive.`
            );
        }

        // Calculate max shares and determine the ID length
        const maxShares = (1 << bits) - 1;
        const idLength = maxShares.toString(this.config.radix).length;

        // Define a regex to extract the components of the share
        const regex = new RegExp(
            `^([a-kA-K3-9]{1})([a-fA-F0-9]{${idLength}})([a-fA-F0-9]+)$`
        );

        const match = regex.exec(share);
        if (!match) {
            throw new Error("The share data provided is invalid: " + share);
        }

        // Extract and validate the share ID
        const id = parseInt(match[2], this.config.radix);
        if (!Number.isInteger(id) || id < 1 || id > maxShares) {
            throw new Error(
                `Invalid share: Share ID must be an integer between 1 and ${maxShares}, inclusive.`
            );
        }

        // Return the extracted components as an object
        if (match && match[3]) {
            return {
                bits,
                id,
                data: match[3], // Hexadecimal data of the share
            }
        }
        throw new Error("Invalid share: Share data is missing.");
    };


    combine(shares: string[], at: number = 0): string {
        if (!shares || shares.length === 0) {
            throw new Error("No shares provided for combination.");
        }

        let setBits: number | undefined;
        const x: number[] = [];
        const y: number[][] = [];

        for (const shareStr of shares) {
            const share = this.extractShareComponents(shareStr);

            // Validate bit settings across shares
            if (setBits === undefined) {
                setBits = share.bits;
            } else if (share.bits !== setBits) {
                throw new Error("Mismatched shares: Different bit settings.");
            }

            // Process share if its ID is not already in `x`
            if (!x.includes(share.id)) {
                x.push(share.id);

                const splitShare = Secrets.splitNumStringToIntArray(this.hex2bin(share.data), this.config.bits);

                for (let j = 0; j < splitShare.length; j++) {
                    if (!y[j]) {
                        y[j] = [];
                    }
                    y[j][x.length - 1] = splitShare[j];
                }
            }
        }

        // Use Lagrange interpolation to reconstruct the secret
        let result = "";
        for (const shareRow of y) {
            const interpolatedValue = Secrets.lagrange(at, x, shareRow, this.config);
            result = this.padLeft(interpolatedValue.toString(2)) + result;
        }

        // If `at` is non-zero, return the interpolated share directly
        if (at >= 1) {
            return this.bin2hex(result);
        }

        // Remove the padding marker ("1") added during sharing and convert to hex
        const secretBinary = result.slice(result.indexOf("1") + 1);
        return this.bin2hex(secretBinary);
    }

    random(bits: number = this.config.bits): string {
        if (
            typeof bits !== "number" ||
            bits % 1 !== 0 ||
            bits < 2 ||
            bits > 65536
        ) {
            throw new Error(
                "Number of bits must be an Integer between 1 and 65536."
            )
        }

        return this.bin2hex(this.rng())
    }
    newShare(id: number | string, shares: string[]): string {
        // Convert `id` to a number if it is provided as a string
        if (typeof id === "string") {
            id = parseInt(id, this.config.radix);
        }

        // Validate `id`
        if (!Number.isInteger(id) || id < 1 || id >= Math.pow(2, this.config.bits)) {
            throw new Error(
                `Invalid 'id': Must be an integer between 1 and ${Math.pow(2, this.config.bits) - 1}, inclusive.`
            );
        }

        // Convert `id` to the required radix representation
        const radid = id.toString(this.config.radix);

        // Validate shares and extract the first share's components
        const firstShare = shares[0];
        const share = this.extractShareComponents(firstShare);

        // Construct the new share
        return Secrets.constructPublicShareString(
            share.bits,  // Use the same bit setting as the first share
            Number(radid),       // New share's ID in the configured radix
            this.combine(shares, id) // Combine existing shares to compute the new share
            , this.config
        );
    }
    static hex2str(hex: string): string {

        let str = '';

        for (let i = 0; i < hex.length; i += 2) {

            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));

        }

        return str;

    }

    static str2hex(str: string): string {

        let hex = '';

        for (let i = 0; i < str.length; i++) {

            hex += ('0' + str.charCodeAt(i).toString(16)).slice(-2);

        }

        return hex;

    }

    str2hex(str: string): string {

        return Secrets.str2hex(str);
    }

    hex2str(hex: string): string {
        return Secrets.hex2str(hex);
    }




}//end of Secrets class
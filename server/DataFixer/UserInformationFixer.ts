import { secrets } from "easy-shamir-secret-sharing";
import { IUser } from "../db_data_schema/UserSchema";
import { Mutex } from "async-mutex";

// 全局互斥锁保证密钥恢复的原子性
const globalMutex = new Mutex();

export async function getCorrectUser(
    arr: (IUser | undefined)[],
    problemIndices: number[]
): Promise<IUser> {
    // 输入校验
    if (!arr || !problemIndices) {
        throw new Error("Invalid input parameters");
    }
    if (arr.length === 0) {
        throw new Error("Input array is empty");
    }

    // 创建带原始索引的有效用户数组
    const validUsersWithIndex = arr
        .map((user, originalIndex) => ({ user, originalIndex }))
        .filter((u): u is { user: IUser; originalIndex: number } => !!u.user);

    if (validUsersWithIndex.length === 0) {
        throw new Error("No valid users found");
    }

    // 结果对象和密钥分片收集
    const result: Partial<IUser> = {};
    const keyShares: string[] = [];
    const allKeys = Object.keys(validUsersWithIndex[0].user) as (keyof IUser)[];
    console.log(allKeys);


    // 在字段循环外单独处理密钥分片
    validUsersWithIndex.forEach(({ user, originalIndex }) => {
        if (!problemIndices.includes(originalIndex)) {
            keyShares.push(user.keyOf2FA); // 直接访问字段
        }
    });

    // 需要排除的字段
    const excludeKeys: Set<keyof IUser> = new Set(['keyOf2FA', 'objHash', 'objSign']);

    // 处理每个字段的多数值
    for (const key of allKeys) {
        // // 并行收集密钥分片（排除问题用户）//skip check continue
        // if (key === 'keyOf2FA') {         
        //     console.log(key);

        //     validUsersWithIndex.forEach(({ user, originalIndex }) => {
        //         if (!problemIndices.includes(originalIndex)) {


        //             keyShares.push(user.keyOf2FA);
        //         }
        //     });
        // }
        if (excludeKeys.has(key)) continue;
        //console.log(key);


        // 判斷該欄位是否為 Date
        const isDateField = validUsersWithIndex.some(({ user }) => user[key] instanceof Date);
        const candidates: string[] = [];
        const dateMap = new Map<string, Date>(); // 保留精確原始值對應

        for (const { user, originalIndex } of validUsersWithIndex) {
            if (!problemIndices.includes(originalIndex)) {
                const value = user[key];
                if (value !== undefined && value !== null) {
                    if (isDateField && value instanceof Date) {
                        // 統一使用較低精度統計（這裡以「到秒」為例）
                        //console.log(value.toISOString());
                        
                        const dateKey = value.toISOString()
                        candidates.push(dateKey);
                        // 保留最早遇到的原始 Date 物件（完整精度）
                        if (!dateMap.has(dateKey)) {
                            dateMap.set(dateKey, value);
                        }
                    } else {
                        candidates.push(String(value));
                    }
                }
            }
        }
        // 收集非问题用户的字段值
        // for (const { user, originalIndex } of validUsersWithIndex) {
        //     if (!problemIndices.includes(originalIndex)) {
        //         const value = user[key];
        //         if (value !== undefined && value !== null) {
        //             candidates.push(String(value));
        //         }
        //     }
        // }

        if (candidates.length === 0) {
            throw new Error(`No valid values for field ${String(key)}`);
        }
        // 统计多数值（优化版）
        const frequency = new Map<string, number>();
        let maxCount = 0;
        let mostCommonValue = candidates[0];

        for (const value of candidates) {
            const count = (frequency.get(value) || 0) + 1;
            frequency.set(value, count);

            if (count > maxCount ||
                (count === maxCount && value > mostCommonValue)) {
                maxCount = count;
                mostCommonValue = value;
            }
        }

        // 类型安全转换
        if (isDateField) {
            const originalDate = dateMap.get(mostCommonValue);
            if (!originalDate) {
                throw new Error(`Cannot find original date object for field ${String(key)}`);
            }
            (result as any)[key] = originalDate;
        } else {
            const sample = validUsersWithIndex[0].user[key];
            try {
                result[key] = convertType(mostCommonValue, sample);
            } catch (error: any) {
                throw new Error(`Field ${String(key)} conversion failed: ${error.message}`);
            }
        }
        
    }

    // 使用互斥锁进行密钥恢复
    const release = await globalMutex.acquire();
    try {
        //console.log(keyShares);

        if (keyShares.length < 2) {
            throw new Error("Insufficient shares for secret recovery");
        }

        const restoredKey = await secrets.combine(keyShares);
        if (!isValidKey(restoredKey)) {
            throw new Error("Restored key failed validation");
        }

        result.keyOf2FA = restoredKey;
        result.objHash = "";
        result.objSign = "";

        return validateUser(result as IUser);
    } finally {
        release();
    }
}

/** 类型转换辅助函数 */
function convertType(value: string, sample: any): any {
    if (sample instanceof Date) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date format: ${value}`);
        }
        return date;
    }

    if (typeof sample === "number") {
        const num = Number(value);
        if (isNaN(num)) {
            throw new Error(`Invalid number format: ${value}`);
        }
        return num;
    }

    return value;
}

/** 密钥验证函数（根据实际情况实现） */
/** 密钥验证函数 (完全匹配密钥生成规则) */
function isValidKey(key: string): boolean {
    // 验证规则需与生成逻辑 OTPObj.generateKey() 保持一致：
    // 1. 长度验证（允许自定义长度，默认64）
    // 2. 字符集验证 (Base64 URL-safe 格式)
    // 3. 无等号填充（生成时已被替换）
    return /^[A-Za-z0-9_-]+$/.test(key) &&  // 只允许 URL-safe Base64 字符
        key.length >= 32 //&&              // 最小长度限制（根据你的安全要求）
    //key.length % 4 !== 1;           // 防止无效长度（根据 Base64 编码规则）
}

/** 结果验证函数 */
function validateUser(user: IUser): IUser {
    //console.log(user);

    const requiredFields: (keyof IUser)[] = ['CUUID', 'username', 'keyOf2FA'];
    for (const field of requiredFields) {
        if (!user[field]) {
            throw new Error(`Missing required field: ${String(field)}`);
        }
    }
    return user;
}
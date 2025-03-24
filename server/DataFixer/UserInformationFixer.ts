import { secrets } from "easy-shamir-secret-sharing";
import { IUser } from "../db_data_schema/UserSchema";

export async function getCorrectUser(arr: IUser[], problemInt: number[]): Promise<IUser> {
    if (arr.length === 0) {
        throw new Error("Array is empty");
    }

    // 取出所有的 keys（只取一次）
    const allKeys = Object.keys(arr[0]) as (keyof IUser)[];
    const excludeKeys: (keyof IUser)[] = ['keyOf2FA', 'objHash', 'objSign'];

    const result: Partial<IUser> = {};

    for (const key of allKeys) {
        if (excludeKeys.includes(key)) continue;

        const values: string[] = [];

        // 收集不是 problemInt 中 index 的該欄位值
        for (let i = 0; i < arr.length; i++) {
            if (!problemInt.includes(i)) {
                const value = arr[i][key];
                if (value !== undefined) {
                    values.push(String(value));
                }
            }
        }
        // 統計每個值出現次數
        const freqMap = new Map<string, number>();
        for (const val of values) {
            freqMap.set(val, (freqMap.get(val) || 0) + 1);
        }

        // 找出出現最多的值
        let maxCount = 0;
        let mostCommonVal = "";
        for (const [val, count] of freqMap.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonVal = val;
            }
        }

        // 嘗試轉回原始型別（簡單處理 string / number / Date）
        const sampleValue = arr.find(u => u[key] !== undefined)?.[key];
        if (sampleValue instanceof Date) {
            result[key] = new Date(mostCommonVal) as any;
        } else if (typeof sampleValue === "number") {
            result[key] = Number(mostCommonVal) as any;
        } else {
            result[key] = mostCommonVal as any;
        }
    }

    let keyPart :string[] = []
    //2fa restore 
    arr.forEach(user => {
        keyPart.push(user.keyOf2FA)
    });
    const restore = await secrets.combine(keyPart)
        

    // 補齊 keyOf2FA, objHash, objSign 欄位（你說你會處理，這裡放預設）
    result.keyOf2FA = restore;
    result.objHash = "";
    result.objSign = "";
    return result as IUser;
}

import { secrets } from "easy-shamir-secret-sharing";
import { IStory } from "../db_data_schema/StorySchema";
import { Mutex } from "async-mutex";
import ShamirImageTool from "../utils/imageDistrubutionTool";
import pkg from "js-sha3";
import { groupByIndex } from "../utils/ArrayGroupByIndex";

const { sha3_256 } = pkg
// 全局互斥锁保证图像恢复的原子性
const globalMutex = new Mutex();

/**
 * 
 * @param arr 
 * @param problemIndices 
 * @returns IStory ( image[0] is photo)
 */
export async function getCorrectStory(
    arr: (IStory | undefined)[],
    problemIndices: number[]
): Promise<IStory> {
    // 输入校验
    if (!arr || !problemIndices) {
        throw new Error("Invalid input parameters");
    }
    if (arr.length === 0) {
        throw new Error("Input array is empty");
    }

    // 创建带原始索引的有效Story数组
    const validStoriesWithIndex = arr
        .map((story, originalIndex) => ({ story, originalIndex }))
        .filter((s): s is { story: IStory; originalIndex: number } => !!s.story);

    if (validStoriesWithIndex.length === 0) {
        throw new Error("No valid stories found");
    }

    // 结果对象和图像分片收集
    const result: Partial<IStory> = {};
    const imageShares: string[][] = [];
    const allKeys = Object.keys(validStoriesWithIndex[0].story) as (keyof IStory)[];

    // 在字段循环外单独处理图像分片
    validStoriesWithIndex.forEach(({ story, originalIndex }) => {
        if (!problemIndices.includes(originalIndex)) {
            imageShares.push(story.Image); // 收集图像分片
        }
    });

    // 需要排除的字段
    const excludeKeys: Set<keyof IStory> = new Set(['Image', 'objHash', 'objSign']);

    // 处理每个字段的多数值
    for (const key of allKeys) {
        if (excludeKeys.has(key)) continue;

        // 判断该字段是否为 Date
        const isDateField = validStoriesWithIndex.some(({ story }) => story[key] instanceof Date);
        const candidates: string[] = [];
        const dateMap = new Map<string, Date>();

        for (const { story, originalIndex } of validStoriesWithIndex) {
            if (!problemIndices.includes(originalIndex)) {
                const value = story[key];
                if (value !== undefined && value !== null) {
                    if (isDateField && value instanceof Date) {
                        const dateKey = value.toISOString();
                        candidates.push(dateKey);
                        if (!dateMap.has(dateKey)) {
                            dateMap.set(dateKey, value);
                        }
                    } else {
                        candidates.push(String(value));
                    }
                }
            }
        }

        if (candidates.length === 0) {
            throw new Error(`No valid values for field ${String(key)}`);
        }

        // 统计多数值
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
            const sample = validStoriesWithIndex[0].story[key];
            try {
                result[key] = convertType(mostCommonValue, sample);
            } catch (error: any) {
                throw new Error(`Field ${String(key)} conversion failed: ${error.message}`);
            }
        }
    }

    // 使用互斥锁进行图像恢复
    const release = await globalMutex.acquire();
    try {
        if (imageShares.length < getThreshold()) {
            throw new Error("Insufficient shares for image recovery");
        }
        /**
         * checked. skip all broken data
         */

        // 转置图像分片数组以便恢复
        const transposedShares: string[][] = [];
        console.log();
        
        const shareLength = imageShares[0].length; 

        console.log( "org share Length",shareLength);
        
        
        for (let i = 0; i < shareLength; i++) {
            const shareGroup: string[] = [];
            for (const share of imageShares) {
                shareGroup.push(share[i]);
            }
            transposedShares.push(shareGroup);
        }

        // 恢复每部分图像
        const reverse = transposedShares
        console.log(reverse.length);
        if (reverse.length!= shareLength ) {
            throw new Error("spilte length problem")
        }                        


        const restoredImages = await ShamirImageTool.combineShares(reverse)


        // 验证恢复的图像
        
         
        result.Image = [restoredImages];
        result.objHash = "";
        result.objSign = "";

        return validateStory(result as IStory);
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

    if (typeof sample === "boolean") {
        return value === "true";
    }

    return value;
}

/** 结果验证函数 */
function validateStory(story: IStory): IStory {
    const requiredFields: (keyof IStory)[] = ['UUID', 'UserUUID', 'createdDate', 'isPublic', 'Image'];
    for (const field of requiredFields) {
        if (!story[field]) {
            throw new Error(`Missing required field: ${String(field)}`);
        }
    }
    return story;
}

import { Mutex } from "async-mutex";
import { IPost } from "../db_data_schema/PostSchema";
import ShamirImageTool from "../utils/imageDistrubutionTool";

const globalMutex = new Mutex();
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

/** 结果验证函数 for Post */
function validatePost(post: IPost): IPost {
    const requiredFields: (keyof IPost)[] = ['UUID', 'UserUUID', 'createdDate', 'isPublic', 'Image', 'title', 'content'];
    for (const field of requiredFields) {
        if (!post[field]) {
            throw new Error(`Missing required field: ${String(field)}`);
        }
    }
    return post;
}

/**
 * 
 * @param arr 
 * @param problemIndices 
 * @returns IPost
 */
export async function getCorrectPost(
    arr: (IPost | undefined)[],
    problemIndices: number[]
): Promise<IPost> {
    // 输入校验
    if (!arr || !problemIndices) {
        throw new Error("Invalid input parameters");
    }
    if (arr.length === 0) {
        throw new Error("Input array is empty");
    }

    // 创建带原始索引的有效Post数组
    const validPostsWithIndex = arr
        .map((post, originalIndex) => ({ post, originalIndex }))
        .filter((p): p is { post: IPost; originalIndex: number } => !!p.post);

    if (validPostsWithIndex.length === 0) {
        throw new Error("No valid posts found");
    }

    // 结果对象和图像分片收集
    const result: Partial<IPost> = {};
    const imageShares: string[][] = [];
    const allKeys = Object.keys(validPostsWithIndex[0].post) as (keyof IPost)[];

    // 在字段循环外单独处理图像分片
    validPostsWithIndex.forEach(({ post, originalIndex }) => {
        if (!problemIndices.includes(originalIndex)) {
            imageShares.push(post.Image); // 收集图像分片
        }
    });

    // 需要排除的字段
    const excludeKeys: Set<keyof IPost> = new Set(['Image', 'objHash', 'objSign']);

    // 处理每个字段的多数值
    for (const key of allKeys) {
        if (excludeKeys.has(key)) continue;

        // 判断该字段是否为 Date
        const isDateField = validPostsWithIndex.some(({ post }) => post[key] instanceof Date);
        const candidates: string[] = [];
        const dateMap = new Map<string, Date>();

        for (const { post, originalIndex } of validPostsWithIndex) {
            if (!problemIndices.includes(originalIndex)) {
                const value = post[key];
                if (value !== undefined && value !== null) {
                    if (isDateField && value instanceof Date) {
                        const dateKey = value.toISOString();
                        candidates.push(dateKey);
                        if (!dateMap.has(dateKey)) {
                            dateMap.set(dateKey, value);
                        }
                    } else if (Array.isArray(value)) {
                        // 特殊处理数组字段
                        candidates.push(JSON.stringify(value));
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
        } else if (Array.isArray(validPostsWithIndex[0].post[key])) {
            // 处理数组字段
            try {
                result[key] = JSON.parse(mostCommonValue);
            } catch (error: any) {
                throw new Error(`Field ${String(key)} conversion failed: ${error.message}`);
            }
        } else {
            const sample = validPostsWithIndex[0].post[key];
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

        // 转置图像分片数组以便恢复
        const transposedShares: string[][] = [];
        const shareLength = imageShares[0].length;
        
        for (let i = 0; i < shareLength; i++) {
            const shareGroup: string[] = [];
            for (const share of imageShares) {
                shareGroup.push(share[i]);
            }
            transposedShares.push(shareGroup);
        }

        // 恢复每部分图像
        const restoredImages = await ShamirImageTool.combineShares(transposedShares);
        
        // 处理图像数组
        const restoredImageArray = JSON.parse(restoredImages);
        if (!Array.isArray(restoredImageArray)) {
            throw new Error("Restored image data is not an array");
        }

        result.Image = restoredImageArray;
        result.objHash = "";
        result.objSign = "";

        return validatePost(result as IPost);
    } finally {
        release();
    }
}

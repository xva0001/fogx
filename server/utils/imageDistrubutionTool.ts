import { secrets } from "easy-shamir-secret-sharing";


export function splitBy64(input: string,chunkSize =64): string[] {
    const chunk_size = chunkSize;
    const result: string[] = [];
    for (let i = 0; i < input.length; i += chunk_size ) {
      result.push(input.slice(i, i + chunk_size ));
    }
    return result;
  }

async function share(base64Img:string,chunk = 64,parts:number,threshold:number){
    
    const oneDemantionArr = splitBy64(base64Img,chunk)

    const twoDemantionArrForResult :string[][] = new Array(oneDemantionArr.length)
    

    await Promise.all(oneDemantionArr.map(async (item,index)=>{
        
        const resultForSplit :string[] = await secrets.share(item,parts,threshold)
        twoDemantionArrForResult[index] = resultForSplit

    }))
    return twoDemantionArrForResult
 }

 async function combine(splitedArray:string[][]) {
    
    const resultForCombined :string[] =  new Array(splitedArray.length)

    await Promise.all(splitedArray.map(async (item,index)=>{
        const result = await secrets.combine(item)
        resultForCombined[index] = result
    }))
    //ret
    return resultForCombined.join("")
 }

 class ShamirImageTool {
    static async splitAndShare(
        base64Img: string,
        parts: number,
        threshold: number,
        chunkSize: number = 64
    ): Promise<string[][]> {
        return await share(base64Img, chunkSize, parts, threshold);
    }

    static async combineShares(splittedArray: string[][]): Promise<string> {
        return await combine(splittedArray);
    }
}
/**
 * for long string, use chunk
 */
class ShaimirStringSplitTool{
    static async splitAndShare(
        inputString: string,
        parts: number,
        threshold: number,
        chunkSize: number = 64
    ): Promise<string[][]> {
        return await share(inputString, chunkSize, parts, threshold);
    }

    static async combineShares(splittedArray: string[][]): Promise<string> {
        return await combine(splittedArray);
    }
}

export { ShaimirStringSplitTool };
export default ShamirImageTool;

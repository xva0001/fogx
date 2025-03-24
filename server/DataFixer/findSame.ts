function findMostFrequentString(arr: string[]): { value: string; count: number } | null {
    if (arr.length === 0) return null;
  
    const freqMap = new Map<string, number>();
  
    for (const str of arr) {
      freqMap.set(str, (freqMap.get(str) || 0) + 1);
    }
  
    let maxCount = 0;
    let mostFrequent = '';
  
    for (const [str, count] of freqMap.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = str;
      }
    }
  
    return { value: mostFrequent, count: maxCount };
  }
  
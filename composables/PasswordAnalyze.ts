// 配置对象（便于调整参数）
const passwordConfig = {
    minLength: 12,
    optimalLength: 16,
    maxLength: 24,
    entropyThresholds: {
      weak: 28,
      medium: 35,
      strong: 60
    },
    weights: {
      length: 0.4,
      variety: 0.3,
      entropy: 0.3
    }
  };
  
  function analyzePassword(password: string): {
    score: number;
    entropy: number;
    meetsRequirements: boolean;
  } {
    // 初始化分析结果
    const analysis = {
      charTypes: new Set<string>(),
      has: {
        lowercase: false,
        uppercase: false,
        number: false,
        symbol: false,
        extendedSymbol: false
      },
      length: password.length,
      sequences: 0,
      repeats: 0,
      commonPatterns: 0
    };
  
    let prevCharCode = 0;
    let repeatCount = 1;
  
    // 详细字符分析
    for (const [i, char] of [...password].entries()) {
      // 字符类型检测
      if (/[a-z]/.test(char)) {
        analysis.has.lowercase = true;
        analysis.charTypes.add('lowercase');
      } else if (/[A-Z]/.test(char)) {
        analysis.has.uppercase = true;
        analysis.charTypes.add('uppercase');
      } else if (/[0-9]/.test(char)) {
        analysis.has.number = true;
        analysis.charTypes.add('number');
      } else if (/[\x20-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/.test(char)) {
        analysis.has.symbol = true;
        analysis.charTypes.add('symbol');
      } else if (/[^\x00-\x7F]/.test(char)) {
        analysis.has.extendedSymbol = true;
        analysis.charTypes.add('extended');
      }
  
      // 序列和重复检测
      const currentCharCode = char.charCodeAt(0);
      if (Math.abs(currentCharCode - prevCharCode) === 1) {
        analysis.sequences++;
      }
      if (currentCharCode === prevCharCode) {
        repeatCount++;
        if (repeatCount >= 3) analysis.repeats++;
      } else {
        repeatCount = 1;
      }
      prevCharCode = currentCharCode;
    }
  
    // 常见模式检测
    const commonPatterns = [
      '123', 'abc', 'qwe', 'password', 'admin'
    ];
    analysis.commonPatterns = commonPatterns
      .filter(pattern => password.toLowerCase().includes(pattern))
      .length;
  
    // 计算熵值（使用更精确的字符集计算）
    const charSetSize = calculateCharSetSize(analysis);
    const entropy = password.length * Math.log2(charSetSize);
  
    // 综合评分计算
    const lengthScore = calculateLengthScore(analysis.length);
    const varietyScore = calculateVarietyScore(analysis.charTypes.size);
    const entropyScore = calculateEntropyScore(entropy);
    const penalty = analysis.sequences * 0.5 + analysis.repeats * 1 + analysis.commonPatterns * 3;
  
    const rawScore = 
      (lengthScore * passwordConfig.weights.length) +
      (varietyScore * passwordConfig.weights.variety) +
      (entropyScore * passwordConfig.weights.entropy);
  
    const finalScore = Math.max(0, rawScore - penalty);
  
    return {
      score: finalScore,
      entropy,
      meetsRequirements: analysis.length >= passwordConfig.minLength &&
        analysis.charTypes.size >= 3
    };
  }
  
  // 辅助计算函数
  function calculateCharSetSize(analysis: any): number {
    let size = 0;
    if (analysis.has.lowercase) size += 26;
    if (analysis.has.uppercase) size += 26;
    if (analysis.has.number) size += 10;
    if (analysis.has.symbol) size += 32;
    if (analysis.has.extendedSymbol) size += 128;
    return size;
  }
  
  function calculateLengthScore(length: number): number {
    const maxLength = 24;
    return Math.min(1, length / maxLength);
  }
  
  function calculateVarietyScore(variety: number): number {
    return Math.min(1, variety / 5);
  }
  
  function calculateEntropyScore(entropy: number): number {
    return entropy < 28 ? 0 :
      entropy < 35 ? 0.5 :
      entropy < 60 ? 0.75 : 1;
  }

  class passwordAnalyzer{
    static getPasswordScore(password:string){
        return analyzePassword(password)
    }
  }

  export default passwordAnalyzer
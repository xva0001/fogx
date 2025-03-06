export function convertMsToJoseTime(ms: number): string {
    return `${Math.floor(ms / 1000)}s`;
  }
  
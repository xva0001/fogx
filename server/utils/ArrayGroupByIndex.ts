export function groupByIndex<T>(twoDArray: T[][]): { groups: T[][]; innerLength: number } {
    if (twoDArray.length === 0) {
        return { groups: [], innerLength: 0 };
    }

    const innerLength = twoDArray[0].length;
    const groups: T[][] = [];

    for (let i = 0; i < innerLength; i++) {
        const group: T[] = twoDArray.map(innerArray => innerArray[i]);
        groups.push(group);
    }

    return { groups, innerLength };
}
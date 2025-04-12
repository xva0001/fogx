/**
 * too slow 
 * @param twoDArray 
 * @returns 
 */
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
export function groupByIndex_V2<T>(twoDArray: T[][]): { groups: T[][]; innerLength: number } {
    const rowCount = twoDArray.length;
    if (rowCount === 0) return { groups: [], innerLength: 0 };

    const colCount = twoDArray[0].length;
    const groups: T[][] = new Array(colCount);

    for (let i = 0; i < colCount; i++) {
        groups[i] = new Array(rowCount);
    }

    for (let row = 0; row < rowCount; row++) {
        const currentRow = twoDArray[row];
        for (let col = 0; col < colCount; col++) {
            groups[col][row] = currentRow[col];
        }
    }

    return { groups, innerLength: colCount };
}

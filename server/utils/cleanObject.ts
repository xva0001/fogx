export function cleanMongoObject<T extends Record<string, any>>(
    obj: T,
    excludeKeys: (keyof T)[] = ['_id', '__v']
  ): Omit<T, keyof T> {
    const cleanObj = {} as Partial<T>;
  
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !excludeKeys.includes(key)) {
        (cleanObj as Record<string, any>)[key] = obj[key];
      }
    }
  
    return cleanObj as Omit<T, keyof T>;
  }
  
/**
 * 获取数据分片数量
 * Get the number of data shares.
 * @returns {number} The number of shares.
 */
export const getSharePartNum = (): number => {
    const appConfig = useAppConfig();
    const connStringEnvArrLength = appConfig.db.conntion.conn_string_env_arr.length;
    
    // 如果自定义的“shares”不为空，并且值小于3，则使用数据库连接字符串数组的长度作为分片数量。
    // 如果自定义的“shares”不为空且值大于等于3，则使用自定义的“shares”值。
    // 如果自定义的“shares”为空，则使用数据库连接字符串数组的长度作为分片数量。
    // If "customize.shares" is not null and it is less than 3, return the length of the database connection string array.
    // If "customize.shares" is not null and it is 3 or greater, return the "customize.shares" value.
    // If "customize.shares" is null, return the length of the database connection string array.
    if (appConfig.dataDistributionMode.customize.shares !== null) {
        if (appConfig.dataDistributionMode.customize.shares < 3) {
            return connStringEnvArrLength;
        } else {
            return appConfig.dataDistributionMode.customize.shares;
        }
    } else {
        return connStringEnvArrLength;
    }
};

/**
 * 获取数据恢复所需的最小分片数量（即阈值）
 * Get the threshold needed to restore the data (i.e., the minimum number of shares needed).
 * @returns {number} The threshold needed to restore the data.
 */
export const getThreshold = (): number => {
    const appConfig = useAppConfig();
    const shares = getSharePartNum();
    
    // 如果自定义的“restore”不为空，且值小于2，根据分片数量的奇偶性返回不同的值：
    // 如果分片数量是偶数，返回 shares / 2 + 1；如果分片数量是奇数，返回 Math.ceil(shares / 2)。
    // 如果自定义的“restore”不为空且值大于等于2，则使用自定义的“restore”值。
    // 如果自定义的“restore”为空，则根据配置的“mode”值决定：
    // - "strict": 返回 shares，表示所有节点都需要在线。
    // - "half-mode": 返回 Math.ceil(shares / 2)。
    // - "debug-mode": 返回1，表示任何单个节点可以恢复数据。
    // - "debug-mode-half": 返回 Math.ceil(shares / 2)。
    // If "customize.restore" is not null and it is less than 2, if the "shares" value is even, return shares / 2 + 1;
    // if "shares" value is odd, return Math.ceil(shares / 2).
    // If "customize.restore" is not null and it is 2 or greater, return the "customize.restore" value.
    // If "customize.restore" is null, use a switch based on the configured "mode" value:
    // - "strict": return shares (i.e., all nodes need to be operational).
    // - "half-mode": return Math.ceil(shares / 2).
    // - "debug-mode": return 1 (i.e., any single node can restore the data).
    // - "debug-mode-half": return Math.ceil(shares / 2).
    if (appConfig.dataDistributionMode.customize.restore !== null) {
        if (appConfig.dataDistributionMode.customize.restore < 2) {
            if (shares % 2 === 0) {
                return shares / 2 + 1;
            } else {
                return Math.ceil(shares / 2);
            }
        } else {
            return appConfig.dataDistributionMode.customize.restore;
        }
    } else {
        switch (appConfig.dataDistributionMode.mode) {
            case "strict":
                return shares;
            case "half-mode":
                return Math.ceil(shares / 2);
            case "debug-mode":
                return 1;
            case "debug-mode-half":
                return Math.ceil(shares / 2);
            default:
                throw new Error(`Unknown mode: ${appConfig.dataDistributionMode.mode}`);
        }
    }
};

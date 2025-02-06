import mongoose, { Connection, ConnectOptions } from "mongoose";

// 定義 mongoose 連線選項
const MONGO_OPTIONS: ConnectOptions = {
  serverApi: {
    version: "1",
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10_000,
};

/**
 * 根據給定的 MongoDB URI 建立連線
 * @param uri - MongoDB 連線字串
 * @returns Promise<Connection>
 */
export const mongoDBConn = async (uri: string): Promise<Connection> => {
  if (!uri) {
    throw new Error("Undefined MongoDB URI");
  }
  try {
    const connection = await mongoose.createConnection(uri, MONGO_OPTIONS);
    //console.log("MongoDB connection successful");
    return connection;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

/**
 * 根據環境變數的鍵名取得 MongoDB URI 並建立連線
 * @param envKey - 儲存 MongoDB URI 的環境變數鍵名 (例如: "mdb1")
 * @returns Promise<Connection>
 */
export const createDBConnection = async (envKey: string): Promise<Connection> => {
  const uri = process.env[envKey];//get env 
  console.log(uri);
  
  if (!uri) {
    throw new Error(`Environment variable "${envKey}" is undefined.`);
  }
  return await mongoDBConn(uri);
};

/**
 * 平行初始化多個資料庫連線
 */
export const dbConnsOpen = async (dbNames: string[]): Promise<void> => {
  const dbConnections = [];

  try {
    for (const name of dbNames) {
      const db = await createDBConnection(name);
      dbConnections.push(db);

      db.on('error', (error) => {
        console.error(`Database connection error for ${name}: ${error.message}`);
      });
      db.on("connected",()=>{
        console.log(`Connected to ${name}`)
      })
    }

    //console.log("All MongoDB connections are established");
  } catch (error) {
    
  }
};


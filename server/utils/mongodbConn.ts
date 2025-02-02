import mongoose from "mongoose"
import { userSchema } from "../db_data_schema/UserSchema"
import { PostSchema } from "../db_data_schema/PostSchema"

export const mongodb_conn_fn = async (uri:string|undefined) => {
    try {
        
        if (uri==undefined) {
            throw Error("undefine mongodb uri")
        }
        const db_conn = await mongoose.createConnection(uri, { serverApi: { version: "1", strict: true, deprecationErrors: true },connectTimeoutMS:10_000 })
        console.log("connection ok")
        return db_conn
    }
    catch (e) {
        console.log(e);
        console.log("Error")
        throw e
    }
}


export const mongodb_user_conn_fn = async ():Promise<mongoose.Connection> => {
    const uri = process.env.MONGODB_USER_DB;
    const conn = await mongodb_conn_fn(uri)
    return conn //?.model("User",userSchema)
}

export const mongodb_post_conn_fn = async ():Promise<mongoose.Connection>=>{
        const uri = process.env.MONGODB_POST_DB
        const conn = await mongodb_conn_fn(uri)
        return conn //?.model("Post",PostSchema)
}
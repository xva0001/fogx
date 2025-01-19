import mongoose from "mongoose"

export const mongodb_conn_fn = async () => {
    try {
        const uri = process.env.MONGODB_USER_DB;
        if (uri==undefined) {
            throw Error("undefine mongodb uri")
        }
        const db_conn = await mongoose.connect(uri, { serverApi: { version: "1", strict: true, deprecationErrors: true },connectTimeoutMS:10_000 })
        console.log("connection ok")
        return db_conn
    }
    catch (e) {
        console.log(e);
        console.log("Error")
    }
}

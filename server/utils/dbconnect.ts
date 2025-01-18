import mongoose from "mongoose"

export const mongodb_conn_fn = async () => {
    try {
        const uri = "mongodb+srv://msgfog:hO1Kwgq8esPN1Loe@user.a32p7.mongodb.net/?retryWrites=true&w=majority&appName=user";
        //const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
        const db_conn = await mongoose.connect(uri, { serverApi: { version: "1", strict: true, deprecationErrors: true } })

        console.log("connection ok")
        return db_conn

    }
    catch (e) {
        console.log(e);

        console.log("Error")
    }

}

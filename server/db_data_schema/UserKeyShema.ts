import { model, Schema } from "mongoose";

export interface IUserKey{
 
    UUID : string
    pubkey : string
    privateKeyHash : string
    createdDate :Date
    objHash : string
    objSign : string

}



const UserKeyShema = new Schema<IUserKey>({

    UUID : { type: String, required: true, immutable: true },
    pubkey : { type : String, required: true},
    privateKeyHash: {type: String,required:true},
    createdDate: {type : Date,required: true},
    objHash :{ type : String, required: true},
    objSign :{ type : String, required: true},

})
UserKeyShema.index({ UUID: 1, createdDate: 1 }, { unique: true });

export default UserKeyShema
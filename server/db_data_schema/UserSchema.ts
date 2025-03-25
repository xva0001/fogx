import { model, Schema } from "mongoose";
export enum Role {
    Admin = 'admin',
    User = 'user',
    sponsor = 'sponsor',
}

export interface IUser {
    
    CUUID: string,
    Email: string,
    sha3_256: string,
    sha3_384: string,
    createdDate: Date,
    updatedDate: Date,
    lastestLoginDate: Date,
    keyOf2FA: string,
    backupCode: string[],
    icon?: string, // base64
    username: string,
    roles?: Role[],
    objHash:String
    objSign :string

}
export interface IUser_Hash {
    CUUID: string;
    Email: string;
    sha3_256: string;
    sha3_384: string;
    createdDate: Date;
    updatedDate?: Date; // Made optional //no hash水木水木
    lastestLoginDate: Date;
    keyOf2FA: string;
    backupCode: string[];
    username: string;
    objHash: string;
    objSign: string;
}
const regex_sha256 = /^[a-fA-F0-9$]{64}$/;
const regex_sha384 = /^[a-fA-F0-9$]{96}$/;
const userSchema = new Schema<IUser>({
    CUUID: { type: String, required: true, unique: true, immutable: true },
    Email: { type: String, required: true, unique: true },
    sha3_256: {
        type: String,
        required: true,
        match: [regex_sha256, 'Invalid SHA3-256 hash format. Must be 64 hex characters.']
    },
    sha3_384: {
        type: String,
        required: true,
        match: [regex_sha384, 'Invalid SHA3-384 hash format. Must be 96 hex characters.']
    },
    createdDate: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    updatedDate: { type: Date, default: Date.now },
    lastestLoginDate: { type: Date },
    keyOf2FA: {
        type: String,
        required: true
    },
    backupCode: {
        type: [String],
        required: true
    },
    icon: {
        type: String,
        default: ''
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    roles: {
        type: [String],
        enum: Object.values(Role), // 使用枚舉的值來限定
        default: [Role.User],      // 默認為普通用戶
    },
    objHash: {
        type: String,
        required: true
    },
    objSign: {
        type: String,
        required: true
    },
});

userSchema.pre("save", function (next) {
    this.updatedDate = new Date();
    next();
});

const User = model<IUser>("User", userSchema);
export { User, userSchema };

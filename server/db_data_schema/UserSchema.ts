import mongoose, { Schema, Document, model } from "mongoose";

export enum Role {
    Admin = 'admin',
    User = 'user',
    sponsor = 'sponsor',
}

export interface IUser extends Document {
    UUID: string,
    Email: string,
    sha3_256: string,
    sha_256: string,
    createdDate: Date,
    lastestLoginDate: Date,
    keyOf2FA: string,
    backupCode: string[],
    icon?: string,//base64
    username: string
    roles: Role[]
}
const regex_sha256 = /^[a-fA-F0-9$]{64}$/;
const userSchema = new Schema<IUser>({
    UUID: { type: String, required: true, unique: true, immutable: true },
    Email: { type: String, required: true, unique: true },
    sha3_256: {
        type: String,
        required: true,
        match: [regex_sha256, 'Invalid SHA3-256 hash format. Must be 64 hex characters.']
    },
    sha_256: {
        type: String,
        required: true,
        match: [regex_sha256, 'Invalid SHA-256 hash format. Must be 64 hex characters.']
    },
    createdDate: {
        type: Date,
        default: Date.now,
        immutable: true
    },
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
});

const User = model<IUser>("User", userSchema)
export  {User,userSchema};
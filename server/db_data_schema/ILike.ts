import mongoose, { Schema, model } from "mongoose";

export interface ILike {
  _id?: mongoose.Types.ObjectId;
  PostUUID: string;
  UserUUID: string;
  createdDate: Date;
}

const LikeSchema = new Schema<ILike>({
  PostUUID: { type: String, required: true },
  UserUUID: { type: String, required: true },
  createdDate: { type: Date, default: Date.now }
});

LikeSchema.index({ PostUUID: 1, UserUUID: 1 }, { unique: true });

const Like = mongoose.model<ILike>('Like', LikeSchema);

export { Like, LikeSchema };
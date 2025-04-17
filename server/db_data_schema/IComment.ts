import mongoose, { Schema } from "mongoose";

export interface Icomment {
  _id?: mongoose.Types.ObjectId;
  UserUUID: string;
  PostUUID: string,
  createdDate: Date;
  isPublic: boolean
  iv: string
  content: string;
  objHash: string,
  objSign: string
}

const CommentSchema = new Schema<Icomment>({
  UserUUID: { type: String, required: true },
  PostUUID: { type: String, required: true },
  createdDate: { type: Date, immutable: true, default: Date.now },
  isPublic:{type: Boolean,required:true  },
  iv:{type:String,required:true,default:""},
  content: { type: String, required: true, maxlength: 1000 },
  objHash: { type: String, required: true },
  objSign: { type: String, required: true },
});
const Comment = mongoose.model<Icomment>('Comment', CommentSchema);

CommentSchema.index({ PostUUID: 1, createdDate: -1 });
CommentSchema.index({ UserUUID: 1 });

export { Comment, CommentSchema }
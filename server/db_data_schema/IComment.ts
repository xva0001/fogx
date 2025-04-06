import mongoose, { Schema } from "mongoose";

export interface Icomment{
    UserUUID: string;
    PostUUID:string,
    createdDate: Date;
    content: string;
    objHash:string,
    objSign : string
  }
  const CommentSchema = new Schema<Icomment>({
    UserUUID: { type: String, required: true },
    PostUUID:{type:String,required:true},
    createdDate: { type: Date, immutable: true },
    content: { type: String, required: true, maxlength: 1000 },
    objHash:{type:String,required:true},
    objSign:{type:String,required:true},
  });
  const Comment = mongoose.model<Icomment>('Comment', CommentSchema);

  export {Comment,CommentSchema}
import mongoose,{ model,Schema } from "mongoose";
import { CommentSchema, Icomment } from "./IComment";


export interface IPost_response {
  UUID: string;
  UserUUID: string;
  createdDate: Date;
  title: string;
  content: string;
  Image: string[];
  tags: string[];
  comments?: Icomment[];
}

export interface IPost {
  UUID: string;
  UserUUID: string;
  createdDate: Date;
  title: string;
  content: string;
  Image: string[];
  tags: string[];
  objHash:string,
  objSign:string
}


const PostSchema = new Schema<IPost>({
  UUID: { type: String, required: true, unique: true },
  UserUUID: { type: String, required: true },
  createdDate: { type: Date, required:true, immutable: true },
  title: { type: String, required: true, trim: true, maxlength: 255 },
  content: { type: String, required: true, maxlength: 5000 },
  Image: {
    type: [String],
    default: [],
  },
  tags: {
    type: [String],
    default: [],
  },
  objHash:{type:String,required:true},
  objSign:{type:String,required:true},
  
});

// 創建模型
const Post = mongoose.model<IPost>('Post', PostSchema);


export { Post, CommentSchema,PostSchema };

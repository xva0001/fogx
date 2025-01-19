import mongoose,{ model,Schema } from "mongoose";

export interface Icomment{
  UserUUID: string;
  createdDate: Date;
  content: string;
}

export interface IPost {
  UUID: string;
  UserUUID: string;
  createdDate: Date;
  title: string;
  content: string;
  Image: string[];
  tags: string[];
  comments: Icomment[];
}

const CommentSchema = new Schema<Icomment>({
  UserUUID: { type: String, required: true },
  createdDate: { type: Date, default: Date.now, immutable: true },
  content: { type: String, required: true, maxlength: 1000 },
});

const PostSchema = new Schema<IPost>({
  UUID: { type: String, required: true, unique: true },
  UserUUID: { type: String, required: true },
  createdDate: { type: Date, default: Date.now, immutable: true },
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
  comments: { type: [CommentSchema], default: [] },
});

// 創建模型
const Post = mongoose.model<IPost>('Post', PostSchema);
const Comment = mongoose.model<Icomment>('Comment', CommentSchema);

export { Post, Comment,CommentSchema,PostSchema };

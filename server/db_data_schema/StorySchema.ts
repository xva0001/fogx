import mongoose,{ model,Schema } from "mongoose";
import { CommentSchema, Icomment } from "./IComment";

// one image only, 1 d array
//delete over 24 h story
export interface IStory_response {
  UUID: string;
  UserUUID: string;
  createdDate: Date;
  Image: string;
}

export interface IStory {
  UUID: string,
  UserUUID: string,
  createdDate: Date,
  isPublic:boolean,
  iv:string,
  Image: string[],
  objHash:string,
  objSign:string
}
const StorySchema = new Schema<IStory>({
  UUID: { type: String, required: true, unique: true },
  UserUUID: { type: String, required: true },
  createdDate: { type: Date, required:true, immutable: true },
  //for aes
  isPublic:{type: Boolean,required:true  },
  iv:{type:String, default:""},
  Image: {
    type: [String],
    default: [],
  },
  objHash:{type:String,required:true},
  objSign:{type:String,required:true},
  
});
// Create model
const Story = mongoose.model<IStory>('Story', StorySchema);


export { Story, CommentSchema, StorySchema };

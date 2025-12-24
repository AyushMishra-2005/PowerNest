import mongoose from "mongoose";
import { Schema } from "mongoose";

const blockSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      reqired: true,
    },
    blockName: {
      type: String,
      required: true,
    },
    blockType: {
      type: String,
      required: true,
    },
    blockDescription:{
      type: String,
      required: true,
    },
    sensorEspId:{
      type: String,
      required: true,
    },
    roomEspId:{
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const Block = mongoose.model("Block", blockSchema);

export default Block;























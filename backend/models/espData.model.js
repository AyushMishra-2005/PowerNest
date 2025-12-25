import mongoose from "mongoose";
import { Schema } from "mongoose";

const espDataSchema = new Schema(
  {
    blockId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Block",
      required: true,
      unique: true
    },
    allEspPins:{
      type: [Number],
      default:[4, 5, 12, 13, 14, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33]
    },
    availableSensorEspPins:{
      type:[Number],
      default:[4, 5, 12, 13, 14, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
    },
    availableRoomEspPins:{
      type:[Number],
      default:[4, 5, 12, 13, 14, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
    },
    connectedPins:{
      type:[
        {
          sensorEspPin:{
            type: Number,
            required: true,
          },
          roomEspPin:{
            type: Number,
            required: true,
          }
        },
      ],
      required: true,
      default:[]
    }
  }
);

const EspData = mongoose.model("EspData", espDataSchema);

export default EspData;






















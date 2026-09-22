import mongoose from "mongoose";
import { Schema } from "mongoose";

const solarEspSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    solarName: {
      type: String,
      required: true,
      trim: true,
    },

    espId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    buildingLocation: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const SolarESP = mongoose.model("SolarESP", solarEspSchema);

export default SolarESP;
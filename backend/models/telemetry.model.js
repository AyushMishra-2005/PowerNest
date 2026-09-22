import mongoose from "mongoose";
import { Schema } from "mongoose";

const telemetrySchema = new Schema(
  {
    solarEspId: {
      type: Schema.Types.ObjectId,
      ref: "SolarESP",
      required: true,
      index: true,
    },

    timestamp: {
      type: Number,
      required: true,
    },

    sunlight: {
      type: Number,
      required: true,
    },

    solarVoltage: {
      type: Number,
      required: true,
    },

    solarCurrent: {
      type: Number,
      required: true,
    },

    solarPower: {
      type: Number,
      required: true,
    },

    requestedLoad: {
      type: Number,
      required: true,
    },

    essentialLoad: {
      type: Number,
      required: true,
    },

    nonEssentialLoad: {
      type: Number,
      required: true,
    },

    actualLoad: {
      type: Number,
      required: true,
    },

    netPower: {
      type: Number,
      required: true,
    },

    excessSolarPower: {
      type: Number,
      required: true,
    },

    powerDeficit: {
      type: Number,
      required: true,
    },

    powerCondition: {
      type: String,
      required: true,
    },

    supplyMode: {
      type: String,
      required: true,
    },

    battery: {
      type: Number,
      required: true,
    },

    batteryEnergy: {
      type: Number,
      required: true,
    },

    batteryVoltage: {
      type: Number,
      required: true,
    },

    batteryPower: {
      type: Number,
      required: true,
    },

    batteryState: {
      type: String,
      required: true,
    },

    batteryUsed: {
      type: Boolean,
      required: true,
    },

    batteryCharging: {
      type: Boolean,
      required: true,
    },

    batteryIdle: {
      type: Boolean,
      required: true,
    },

    batteryCritical: {
      type: Boolean,
      required: true,
    },

    batteryFull: {
      type: Boolean,
      required: true,
    },

    essentialActive: {
      type: Boolean,
      required: true,
    },

    nonEssentialActive: {
      type: Boolean,
      required: true,
    },

    energySaveActive: {
      type: Boolean,
      required: true,
    },

    status: {
      type: String,
      required: true,
    },

    event: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

telemetrySchema.index({
  solarEspId: 1,
  createdAt: -1,
});

const Telemetry = mongoose.model("Telemetry", telemetrySchema);

export default Telemetry;
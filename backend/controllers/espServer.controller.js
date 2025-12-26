import Block from "../models/block.model.js";
import EspData from "../models/espData.model.js";
import { io, getUserSocketId } from "../SocketIO/server.js";

export const findRoomEspId = async (req, res) => {
  const { sensorEspId, pin, payload } = req.body;

  if (!sensorEspId || sensorEspId.trim() === "") {
    return res.status(400).json({
      message: "sensorEspId is required",
    });
  }

  if (pin === undefined || pin === null) {
    return res.status(400).json({
      message: "sensor pin is required",
    });
  }

  try {
    const block = await Block.findOne({ sensorEspId });
    const sensorPinNumber = Number(pin);

    if (!block) {
      return res.status(404).json({
        message: "Block not found",
      });
    }

    const blockId = block._id;
    const userId = block.userId;
    const userSocketId = getUserSocketId(userId);

    const espData = await EspData.findOne({ blockId });

    if (!espData) {
      return res.status(404).json({
        message: "ESP data not found for this block",
      });
    }

    const connection = espData.connectedPins.find(
      (conn) => conn.sensorEspPin === sensorPinNumber
    );

    if (!connection) {
      return res.status(400).json({
        message: `Sensor pin ${sensorPinNumber} is not connected to any room`,
      });
    }

    if (connection.isBlocked === true) {
      return res.status(403).json({
        message: `Sensor pin ${sensorPinNumber} is blocked`,
      });
    }


    connection.status = payload === "active" ? "connected" : "inactive";
    await espData.save();

    const message = {
      espId: espData._id,
      sensorEspPin: sensorPinNumber,
      roomEspPin: connection.roomEspPin,
      roomNumber: connection.roomNumber,
    };

    if (userSocketId) {
      if (payload === "active") {
        io.to(userSocketId).emit("active", message);
      } else {
        io.to(userSocketId).emit("stopped", message);
      }
    }

    return res.status(200).json({
      roomEspId: block.roomEspId,
      roomEspPin: connection.roomEspPin,
      roomNumber: connection.roomNumber,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

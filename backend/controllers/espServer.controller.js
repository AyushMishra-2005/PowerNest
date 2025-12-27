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

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (payload === "active") {
      if (!connection.activeStartedAt) {
        connection.activeStartedAt = now;
        connection.status = "connected";
      }
    } else {
      if (connection.activeStartedAt) {
        const diffSeconds = Math.floor(
          (now - connection.activeStartedAt) / 1000
        );

        let todayUsage = connection.usageStats.find(
          u => u.date === today
        );

        if (!todayUsage) {
          connection.usageStats.push({
            date: today,
            activeDurationSec: diffSeconds,
          });
        } else {
          todayUsage.activeDurationSec += diffSeconds;
        }

        connection.lastActiveAt = now;
        connection.activeStartedAt = null;
        connection.status = "inactive";
      }
    }

    await espData.save();

    const message = {
      espId: espData._id,
      sensorEspPin: sensorPinNumber,
      roomEspPin: connection.roomEspPin,
      roomNumber: connection.roomNumber,
      lastActiveAt: connection.lastActiveAt,
      activeStartedAt: connection.activeStartedAt,
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

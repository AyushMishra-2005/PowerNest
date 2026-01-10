import EspData from '../models/espData.model.js'
import Block from '../models/block.model.js';

export const addPin = async (req, res) => {
  let { sensorEspPin, roomEspPin, blockId, roomNumber } = req.body;

  if (
    sensorEspPin === undefined ||
    roomEspPin === undefined ||
    !roomNumber ||
    roomNumber.trim() === "" ||
    !blockId
  ) {
    return res.status(400).json({
      success: false,
      message: "all fields are required",
    });
  }
  try {

    sensorEspPin = Number(sensorEspPin);
    roomEspPin = Number(roomEspPin);

    console.log({ sensorEspPin, roomEspPin, blockId });

    const userId = req.user._id;

    const blockData = await Block.findById(blockId);
    if (!blockData) {
      return res.status(404).json({
        message: "block doesn't exist",
      });
    }

    if (!blockData.userId.equals(userId)) {
      return res.status(403).json({
        message: "You cannot modify this block",
      });
    }

    const espData = await EspData.findOne({ blockId });

    if (!espData) {
      return res.status(404).json({
        message: "esp data doesn't exist",
      });
    }

    const sensorPinAvailable = espData.availableSensorEspPins.includes(sensorEspPin);
    const roomPinAvailable = espData.availableRoomEspPins.includes(roomEspPin);

    if (!sensorPinAvailable || !roomPinAvailable) {
      return res.status(400).json({
        message: "One or both pins are not available",
      });
    }

    espData.connectedPins.push({
      roomNumber,
      sensorEspPin,
      roomEspPin
    });

    espData.availableSensorEspPins = espData.availableSensorEspPins.filter(pin => pin != sensorEspPin);

    espData.availableRoomEspPins = espData.availableRoomEspPins.filter(pin => pin != roomEspPin);

    await espData.save();

    return res.status(200).json({
      message: "Pins connected successfully",
      data: espData,
    });

  } catch (err) {
    console.log("Error in addpin", err);
    return res.status(501).json({ message: "Error occurred while connecting pins" });
  }
}


export const getData = async (req, res) => {
  const { blockId } = req.body;
  if (!blockId) {
    return res.status(400).json({
      message: "all fields are required",
    });
  }
  try {

    const userId = req.user._id;

    const blockData = await Block.findById(blockId);
    if (!blockData) {
      return res.status(404).json({
        message: "block doesn't exist",
      });
    }

    if (!blockData.userId.equals(userId)) {
      return res.status(403).json({
        message: "You cannot modify this block",
      });
    }

    const espData = await EspData.findOne({ blockId });
    if (!espData) {
      return res.status(404).json({
        message: "esp data doesn't exist",
      });
    }

    return res.status(200).json({
      message: "success",
      data: espData
    });

  } catch (err) {
    console.log("Error in addpin", err);
    return res.status(501).json({ message: "Error occurred" });
  }
}


export const removeConnection = async (req, res) => {
  const { blockId, connectionId } = req.body;
  if (!blockId || !connectionId) {
    return res.status(400).json({
      message: "all fields are required",
    });
  }

  try {

    const userId = req.user._id;

    const blockData = await Block.findById(blockId);
    if (!blockData) {
      return res.status(404).json({
        message: "block doesn't exist",
      });
    }

    if (!blockData.userId.equals(userId)) {
      return res.status(403).json({
        message: "You cannot modify this block",
      });
    }

    const espData = await EspData.findOne({ blockId });

    if (!espData) {
      return res.status(404).json({
        message: "esp data doesn't exist",
      });
    }

    const connection = espData.connectedPins.find(
      pin => pin._id.toString() === connectionId
    );

    if (!connection) {
      return res.status(404).json({
        message: "connection not found",
      });
    }

    espData.connectedPins = espData.connectedPins.filter(
      pin => pin._id.toString() !== connectionId
    );

    espData.availableSensorEspPins.push(connection.sensorEspPin);
    espData.availableRoomEspPins.push(connection.roomEspPin);

    espData.availableSensorEspPins.sort((a, b) => a - b);
    espData.availableRoomEspPins.sort((a, b) => a - b);

    await espData.save();

    return res.status(200).json({
      message: "connection removed successfully",
      data: espData,
    });

  } catch (err) {
    console.log(err);
    return res.status(501).json({ message: "Error occurred" });
  }

}

export const blockConnection = async (req, res) => {
  const { blockId, connectionId, blockStatus } = req.body;
  if (!blockId || !connectionId) {
    return res.status(400).json({
      message: "all fields are required",
    });
  }

  try {

    const userId = req.user._id;

    const blockData = await Block.findById(blockId);
    if (!blockData) {
      return res.status(404).json({
        message: "block doesn't exist",
      });
    }

    if (!blockData.userId.equals(userId)) {
      return res.status(403).json({
        message: "You cannot modify this block",
      });
    }

    const espData = await EspData.findOne({ blockId });

    if (!espData) {
      return res.status(404).json({
        message: "esp data doesn't exist",
      });
    }

    const connection = espData.connectedPins.find(
      pin => pin._id.toString() === connectionId
    );

    if (!connection) {
      return res.status(404).json({
        message: "connection not found",
      });
    }

    connection.isBlocked = blockStatus;

    if (blockStatus === true) {
      connection.status = "inactive";
    }

    await espData.save();

    return res.status(200).json({
      message: blockStatus
        ? "connection blocked"
        : "connection unblocked",
      data: espData,
    });

  } catch (err) {
    console.log(err);
    return res.status(501).json({ message: "Error occurred" });
  }
}

export const getUsageData = async (req, res) => {
  const { blockId, connectionId } = req.body;
  if (!blockId || !connectionId) {
    return res.status(400).json({
      message: "all fields are required",
    });
  }
  try {

    const userId = req.user._id;

    const blockData = await Block.findById(blockId);
    if (!blockData) {
      return res.status(404).json({
        message: "block doesn't exist",
      });
    }

    if (!blockData.userId.equals(userId)) {
      return res.status(403).json({
        message: "You cannot modify this block",
      });
    }

    const espData = await EspData.findOne({ blockId });

    if (!espData) {
      return res.status(404).json({
        message: "esp data doesn't exist",
      });
    }

    const connection = espData.connectedPins.find(
      pin => pin._id.toString() === connectionId
    );

    if (!connection) {
      return res.status(404).json({
        message: "connection not found",
      });
    }

    return res.status(200).json({
      message: "data fetch successful",
      data:connection
    });

  } catch (err) {
    console.log(err);
    return res.status(501).json({ message: "Error occurred" });
  }
}








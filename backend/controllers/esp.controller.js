import EspData from '../models/espData.model.js'
import Block from '../models/block.model.js';

export const addPin = async (req, res) => {
  let { sensorEspPin, roomEspPin, blockId } = req.body;

  if (
    sensorEspPin === undefined ||
    roomEspPin === undefined ||
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
  const {blockId} = req.body;
  try{

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

    const espData = await EspData.findOne({blockId});
    if (!espData) {
      return res.status(404).json({
        message: "esp data doesn't exist",
      });
    }

    return res.status(200).json({
      message: "success",
      data: espData
    });
    
  }catch(err){
    console.log("Error in addpin", err);
    return res.status(501).json({ message: "Error occurred" });
  }
}














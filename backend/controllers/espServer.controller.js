import Block from "../models/block.model.js";

export const findRoomEspId = async (req, res) => {
  const { sensorEspId } = req.body;

  if (!sensorEspId || sensorEspId.trim() === "") {
    return res.status(400).json({
      message: "sensorEspId is required",
    });
  }

  try {
    const block = await Block.findOne({ sensorEspId });

    if (!block) {
      
      return res.status(404).json({
        message: "Block not found",
      });
    }

    return res.status(200).json({
      roomEspId: block.roomEspId,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

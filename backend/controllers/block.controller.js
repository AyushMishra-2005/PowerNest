import Block from "../models/block.model.js"

export const addNewBlock = async (req, res) => {
  const { blockName, blockType, blockDescription, sensorEspId, roomEspId } = req.body;
  if (
    !blockName?.trim() ||
    !blockType?.trim() ||
    !blockDescription?.trim() ||
    !sensorEspId?.trim() ||
    !roomEspId?.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {

    const userId = req.user._id;
    
    const newBlock = await Block.create({
      userId,
      blockName: blockName.trim(),
      blockType: blockType.trim(),
      blockDescription: blockDescription.trim(),
      sensorEspId: sensorEspId.trim(),
      roomEspId: roomEspId.trim(),
    });

    return res.status(201).json({
      message: "Block created successfully",
      data: newBlock
    });

  } catch (err) {
    console.log("Error in block page:", err);
    return res.status(501).json({message: "block creation failed"});
  }
}






















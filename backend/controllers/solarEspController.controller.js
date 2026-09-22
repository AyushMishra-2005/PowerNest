import SolarESP from "../models/solarEsp.model.js";
import Telemetry from "../models/telemetry.model.js";

export const addSolarESP = async (req, res) => {
  try {
    const {
      solarName,
      espId,
      buildingLocation,
      description,
    } = req.body;

    if (!solarName || !espId || !buildingLocation) {
      return res.status(400).json({
        success: false,
        message: "Solar name, ESP ID and building/location are required",
      });
    }

    const existingESP = await SolarESP.findOne({
      espId: espId.trim(),
    });

    if (existingESP) {
      return res.status(409).json({
        success: false,
        message: "ESP ID is already registered",
      });
    }

    const solarESP = await SolarESP.create({
      userId: req.user._id,
      solarName: solarName.trim(),
      espId: espId.trim(),
      buildingLocation: buildingLocation.trim(),
      description: description?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Solar ESP added successfully",
      solarESP,
    });

  } catch (err) {
    console.error("Add Solar ESP error:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const deleteSolarESP = async (req, res) => {
  try {
    const { id } = req.params;

    const solarESP = await SolarESP.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!solarESP) {
      return res.status(404).json({
        success: false,
        message: "Solar ESP not found",
      });
    }

    await SolarESP.deleteOne({
      _id: id,
    });

    return res.status(200).json({
      success: true,
      message: "Solar ESP deleted successfully",
    });

  } catch (err) {
    console.error("Delete Solar ESP error:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getSolarESPs = async (req, res) => {
  try {
    const solarESPs = await SolarESP.find({
      userId: req.user._id,
      active: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      solarESPs,
    });

  } catch (err) {
    console.error("Get Solar ESPs error:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getRecentTelemetry = async (req, res) => {
  try {
    const { espId } = req.params;
    const userId = req.user._id;

    const solarESP = await SolarESP.findOne({
      espId,
      userId,
      active: true,
    });

    if (!solarESP) {
      return res.status(404).json({
        success: false,
        message: "Solar ESP not found or inactive",
      });
    }

    const tenSecondsAgo = new Date(
      Date.now() - 10 * 1000
    );

    const telemetry = await Telemetry.find({
      solarEspId: solarESP._id,
      createdAt: {
        $gte: tenSecondsAgo,
      },
    })
      .sort({ createdAt: 1 })
      .lean();

    const formattedTelemetry = telemetry.map((item) => ({
      ...item,
      espId: solarESP.espId,
    }));

    return res.status(200).json({
      success: true,
      espId: solarESP.espId,
      data: formattedTelemetry,
    });

  } catch (error) {
    console.error(
      "Get recent telemetry error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
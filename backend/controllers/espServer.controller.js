import Block from "../models/block.model.js";
import EspData from "../models/espData.model.js";
import { io, getUserSocketId } from "../SocketIO/server.js";
import redis from '../config/redis.js'
import User from "../models/user.model.js";
import { emailApi } from '../config/brevo.config.js'
import {generateSecurityVoice} from '../services/tts.service.js'

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
    const cacheKey = `sensor_meta:${sensorEspId}`;

    let cacheData = await redis.get(cacheKey);

    let blockId;
    let userId;
    let roomEspId;
    let blockName;
    let userName;
    let email;

    if (cacheData) {
      blockId = cacheData.blockId;
      userId = cacheData.userId;
      roomEspId = cacheData.roomEspId;
      blockName = cacheData.blockName;
      userName = cacheData.userName;
      email = cacheData.email;

    } else {
      const block = await Block.findOne({ sensorEspId });
      if (!block) {
        return res.status(404).json({
          message: "Block not found",
        });
      }

      blockId = block._id;
      userId = block.userId;
      roomEspId = block.roomEspId;
      blockName = block.blockName;

      const user = await User.findById(userId);
      userName = user.name;
      email = user.email;

      await redis.set(
        cacheKey,
        { blockId, userId, roomEspId, blockName, userName, email },
        { ex: 3600 }
      );
    }

    const sensorPinNumber = Number(pin);
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

    const connectionMode = connection.mode;

    const message = {
      sensorEspPin: sensorPinNumber,
      connectionId: connection._id
    };

    const roomNumber = connection.roomNumber;
    const roomId = connection._id;

    if (userSocketId) {
      if (payload === "active") {
        io.to(userSocketId).emit("active", message);
    
        if (connection.isSecure) {

          const alertText = `Attention! Unauthorized access detected at Room ${roomNumber} in the ${blockName}.`;

          const audioBase64 = await generateSecurityVoice(alertText);

          if (audioBase64 && userSocketId) {
            io.to(userSocketId).emit("security_alert_voice", {
              audio: audioBase64,
              text: alertText
            });
          }

          await emailApi.sendTransacEmail({
            sender: {
              email: process.env.SENDER_EMAIL,
              name: "PowerNest 🚨"
            },
            to: [{ email }],
            subject: "🚨 PowerNest Security Alert: Unauthorized Access Detected",
            htmlContent: `
              <div style="font-family: Arial; background:#fff5f5; padding:20px;">
                
                <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #fecaca;">
                  
                  <div style="background:#dc2626;padding:20px;text-align:center;">
                    <h2 style="color:#ffffff;margin:0;">🚨 SECURITY ALERT 🚨</h2>
                  </div>

                  <div style="padding:25px;color:#111827;">
                    
                    <p>Hi <strong>${userName}</strong>,</p>

                    <p style="color:#dc2626;font-weight:bold;">
                      ⚠️ Unauthorized access attempt detected!
                    </p>

                    <div style="background:#fff1f2;padding:15px;border-left:5px solid #dc2626;border-radius:4px;">
                      <p style="margin:5px 0;">
                        🏢 Block: <strong>${blockName}</strong><br/>
                        🚪 Room: <strong>${roomNumber}</strong><br/>
                        🆔 Room ID: <strong>${roomId}</strong>
                      </p>
                    </div>

                    <p style="margin-top:20px;">
                      Please take immediate action if this activity is not authorized.
                    </p>

                    <div style="text-align:center;margin-top:25px;">
                      <a href="https://powernest-self.vercel.app"
                        style="padding:12px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
                        View Dashboard
                      </a>
                    </div>

                  </div>

                  <div style="background:#111827;color:#ffffff;text-align:center;padding:15px;font-size:12px;">
                    © 2026 PowerNest | Security Monitoring System
                  </div>

                </div>
              </div>
            `
          });
        }

      }else if(payload === "heartbeat"){

        io.to(userSocketId).emit("active", message);

      } 
      else {
        io.to(userSocketId).emit("stopped", message);

        if (connectionMode !== "auto") {
          await emailApi.sendTransacEmail({
            sender: {
              email: process.env.SENDER_EMAIL,
              name: "PowerNest"
            },
            to: [
              {
                email: email
              }
            ],
            subject: "PowerNest Alert: Room Inactive",
            htmlContent: `
              <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                
                <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                  
                  <!-- Header -->
                  <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                    <h2 style="color: #22c55e; margin: 0;">PowerNest Alert</h2>
                  </div>

                  <!-- Body -->
                  <div style="padding: 25px; color: #111827; font-size: 14px; line-height: 1.6;">
                    
                    <p>Hi <strong style="color:#22c55e;">${userName}</strong>,</p>

                    <p>The room appears to be <strong>unoccupied</strong> at the moment.</p>

                    <div style="background:#f9fafb; padding:15px; border-left:4px solid #22c55e; border-radius:4px;">
                      <p style="margin:5px 0;">
                        Block: <strong>${blockName}</strong><br/>
                        Room Number: <strong>${roomNumber}</strong><br/>
                        Room ID: <strong>${roomId}</strong>
                      </p>
                    </div>

                    <p style="margin-top:20px;">
                      You may turn off the power to save energy and optimize usage.
                    </p>

                    <!-- Dashboard Button -->
                    <div style="text-align:center; margin-top:25px;">
                      <a href="https://powernest-self.vercel.app"
                        style="display:inline-block;
                              padding:12px 24px;
                              background:#22c55e;
                              color:#ffffff;
                              text-decoration:none;
                              border-radius:6px;
                              font-weight:bold;
                              font-size:14px;">
                        Open PowerNest Dashboard
                      </a>
                    </div>

                    <p style="margin-top:25px;">
                      Manage it directly from your 
                      <span style="color:#22c55e; font-weight:bold;">PowerNest Dashboard</span>.
                    </p>

                  </div>

                  <!-- Footer -->
                  <div style="background:#111827; color:#ffffff; text-align:center; padding:15px; font-size:12px;">
                    © 2026 PowerNest | Smart Energy Automation
                  </div>

                </div>

              </div>
              `
          });
        }
      }
    }

    return res.status(200).json({
      roomEspId: roomEspId,
      roomEspPin: connection.roomEspPin,
      roomNumber: connection.roomNumber,
      mode: connection.mode,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


export const getActivePins = async (req, res) => {
  const { espId, activePins } = req.body;

  if (!espId || !activePins) {
    return res.status(400).json({
      message: "espId and activePins required."
    });
  }

  try {

    const cacheKey = `esp:${espId}`;
    let cacheData = await redis.get(cacheKey);

    let userId;
    let blockId;

    if (cacheData) {
      userId = cacheData.userId;
      blockId = cacheData.blockId;
    } else {
      console.log("cache miss");

      const block = await Block.findOne({ roomEspId: espId });
      if (!block) {
        return res.status(404).json({
          message: "Block not found",
        });
      }

      userId = block.userId;
      blockId = block._id.toString();

      await redis.set(cacheKey, {
        userId: userId,
        blockId: blockId,
      });

      await redis.expire(cacheKey, 3600);

    }

    const stateKey = `esp_state:${espId}`;
    const now = Date.now();

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    const previousState = await redis.hgetall(stateKey) || {};
    const previousPins = Object.keys(previousState).map(Number);

    const newPins = activePins.map(Number);

    for (const pin of newPins) {
      if (!previousPins.includes(pin)) {
        await redis.hset(stateKey, {
          [pin]: now,
        });
      }
    }

    for (const pin of previousPins) {
      if (!newPins.includes(pin)) {
        const startTime = Number(previousState[pin]);
        const durationSec = (now - startTime) / 1000;

        const result = await EspData.updateOne(
          {
            blockId,
          },
          {
            $inc: {
              "connectedPins.$[pinElem].usageStats.$[dayElem].activeDurationSec":
                durationSec,
            },
          },
          {
            arrayFilters: [
              { "pinElem.roomEspPin": pin },
              { "dayElem.date": today },
            ],
          }
        );

        if (result.modifiedCount === 0) {
          await EspData.updateOne(
            {
              blockId,
              "connectedPins.roomEspPin": pin,
            },
            {
              $push: {
                "connectedPins.$.usageStats": {
                  date: today,
                  activeDurationSec: durationSec,
                },
              },
            }
          );
        }

        await redis.hdel(stateKey, pin);
      }
    }

    const userSocketId = getUserSocketId(userId);

    const message = {
      activePins,
      currBlockId: blockId
    }

    if (userSocketId) {
      io.to(userSocketId).emit("active_pins", message);
    }


  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}























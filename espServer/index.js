import express from "express";
import mqtt from "mqtt";
import cors from "cors";
import { getRoomEspId } from "./services/roomMapping.service.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 9000;

const mqttClient = mqtt.connect("mqtt://broker.hivemq.com:1883");

mqttClient.on("connect", () => {
  console.log("MQTT connected");
  mqttClient.subscribe("powernest/+/pir/+");
});

mqttClient.on("message", async (topic, message) => {
  try {
    const payload = message.toString();
    const [, sensorEspId, type, pin] = topic.split("/");

    if (type !== "pir") return;

    console.log(
      `Motion from ${sensorEspId} | PIN ${pin} | STATE ${payload}`
    );

    const mapping = await getRoomEspId({ sensorEspId, pin, payload });
    if (!mapping) return;

    const { roomEspId, roomEspPin } = mapping;

    const relayTopic = `powernest/${roomEspId}/relay/${roomEspPin}`;
    mqttClient.publish(relayTopic, payload);

  } catch (err) {
    console.error("MQTT handler error:", err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

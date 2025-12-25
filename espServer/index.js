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
  const payload = message.toString();
  const [, sensorEspId, type, pin] = topic.split("/");

  if (type !== "pir") return;

  console.log(
    `Motion from ${sensorEspId} | PIN ${pin} | STATE ${payload}`
  );

  const roomEspId = await getRoomEspId(sensorEspId);

  if (!roomEspId) return;

  const relayTopic = `powernest/${roomEspId}/relay/${pin}`;
  mqttClient.publish(relayTopic, payload);

});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

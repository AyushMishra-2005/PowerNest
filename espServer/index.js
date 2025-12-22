import express from "express";
import mqtt from "mqtt";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 9000;

// FIXED ESP IDS
const PIR_ESP_ID = "ESP_PIR_ROOM_101";
const RELAY_ESP_ID = "ESP_RELAY_ROOM_101";

const mqttClient = mqtt.connect("mqtt://broker.hivemq.com:1883");

mqttClient.on("connect", () => {
  console.log("MQTT connected");

  const topic = `powernest/${PIR_ESP_ID}/pir/+`;
  mqttClient.subscribe(topic);

  console.log("Subscribed to:", topic);
});

mqttClient.on("message", (topic, message) => {
  const payload = message.toString();
  const parts = topic.split("/");

  const espId = parts[1];
  const pin = parts[3];

  if (espId !== PIR_ESP_ID) return;

  console.log(`Motion | PIN ${pin} | ${payload}`);

  const relayTopic = `powernest/${RELAY_ESP_ID}/relay/${pin}`;
  mqttClient.publish(relayTopic, payload);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

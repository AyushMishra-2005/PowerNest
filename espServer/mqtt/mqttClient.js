import mqtt from "mqtt";
import { MQTT_URL, TOPICS } from "../config/mqtt.config.js";
import { handleMessage } from "./messageHandler.js";

const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on("connect", () => {
  console.log("MQTT connected");

  mqttClient.subscribe(TOPICS.PIR);
  mqttClient.subscribe(TOPICS.STATUS);
});

mqttClient.on("message", handleMessage);

export default mqttClient;




























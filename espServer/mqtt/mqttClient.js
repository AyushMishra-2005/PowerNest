import mqtt from "mqtt";
import { MQTT_URL, TOPICS } from "../config/mqtt.config.js";
import { handleMessage } from "./messageHandler.js";

const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on("connect", () => {
  console.log("MQTT connected");

  mqttClient.subscribe(TOPICS.PIR, (err) => {
    console.log(
      err
        ? `PIR subscription failed: ${err.message}`
        : `Subscribed: ${TOPICS.PIR}`
    );
  });

  mqttClient.subscribe(TOPICS.STATUS, (err) => {
    console.log(
      err
        ? `STATUS subscription failed: ${err.message}`
        : `Subscribed: ${TOPICS.STATUS}`
    );
  });

  mqttClient.subscribe(TOPICS.TELEMETRY, (err) => {
    console.log(
      err
        ? `TELEMETRY subscription failed: ${err.message}`
        : `Subscribed: ${TOPICS.TELEMETRY}`
    );
  });
});

mqttClient.on("message", handleMessage);

export const publishRelayCommand = (espId, pin, action) => {
  if (!mqttClient.connected) {
    throw new Error("MQTT not connected!");
  }

  const topic = `powernest/${espId}/relay/${pin}`;

  mqttClient.publish(topic, action);
};

export default mqttClient;
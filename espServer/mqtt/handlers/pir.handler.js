import mqttClient from "../mqttClient.js";
import { getRoomEspId } from "../../services/roomMapping.service.js";

export const handlePir = async (topic, payload) => {

  const [, sensorEspId, , pin] = topic.split("/");

  console.log(
    `Motion from ${sensorEspId} | PIN ${pin} | STATE ${payload}`
  );

  const mapping = await getRoomEspId({
    sensorEspId,
    pin,
    payload
  });

  if (!mapping) return;

  const { roomEspId, roomEspPin, mode } = mapping;

  const relayTopic = `powernest/${roomEspId}/relay/${roomEspPin}`;

  if (mode === "auto") {
    if (payload === "active") {
      mqttClient.publish(relayTopic, "ON");
    } else if (payload === "stopped") {
      mqttClient.publish(relayTopic, "OFF");
    }
  }

  else if (mode === "manual") {
    if (payload === "active") {
      mqttClient.publish(relayTopic, "ON_MANUAL");
    }
  }
};

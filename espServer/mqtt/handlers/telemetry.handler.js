import axios from 'axios';
import server from '../../envirnoment.js';
export const handleTelemetry = async (topic, payload) => {
  try {
    const data = JSON.parse(payload);

    const topicParts = topic.split("/");

    const espId = topicParts[1];

    console.log("ESP ID:", espId);

    await axios.post(
      `${server}/main-server/telemetry`,
      {
        espId,
        ...data
      }
    );

  } catch (err) {
    console.log("Telemetry error:", err.message);
  }
};
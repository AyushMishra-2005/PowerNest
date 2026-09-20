export const handleTelemetry = async (topic, payload) => {
  try {
    const data = JSON.parse(payload);

    const topicParts = topic.split("/");

    const espId = topicParts[1];

    // console.log("PowerNest Telemetry");
    console.log("ESP ID:", espId);
    console.log(data);

  } catch (err) {
    console.log("Telemetry error:", err.message);
  }
};
import express from "express";
import cors from "cors";
import "./mqtt/mqttClient.js"

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 9000;


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

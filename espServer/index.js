import express from "express";
import cors from "cors";
import "./mqtt/mqttClient.js"
import { turnOffRelay } from "./services/relay.service.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 9000;

app.post("/relay/turn-off", async (req, res) => {
  try{
    const {espId, pin} = req.body;

    const result = await turnOffRelay(espId, pin);

    return res.status(200).json(result);
  }catch(err){
    res.status(400).json({
      message: err.message,
    });
  }
});

app.post('/health', (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "espServer",
    timestamp: new Date().toISOString()
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

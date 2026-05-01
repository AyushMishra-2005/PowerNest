import fs from "fs";
import fetch from "node-fetch";
import "dotenv/config";

const text = "Attention! Unauthorized access detected at Room 101 in the Central Block.";

const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-luna-en", {
  method: "POST",
  headers: {
    "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: text
  })
});

const audioBuffer = Buffer.from(await response.arrayBuffer());

fs.writeFileSync("output.mp3", audioBuffer);
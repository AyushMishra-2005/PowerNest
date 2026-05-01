import fetch from "node-fetch";

export const generateSecurityVoice = async (text) => {
  try {
    const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    return audioBuffer.toString("base64");
  } catch (err) {
    console.error("TTS Error:", err);
    return null;
  }
};


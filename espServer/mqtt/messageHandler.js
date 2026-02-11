import { handlePir } from "./handlers/pir.handler.js";
import { handleStatus } from "./handlers/status.handler.js";

export const handleMessage = async (topic, message) => {
  try{
    const payload = message.toString();

    if(topic.startsWith("powernest/status/")){
      return handleStatus(topic, payload);
    }

    if(topic.includes("/pir/")){
      return handlePir(topic, payload);
    }

  }catch(err){
    console.log("MQTT message error: ", err.message);
  }
}


























import { publishRelayCommand } from "../mqtt/mqttClient.js";

export const turnOffRelay = async (espId, pin) => {
  if(!espId || !pin){
    throw new Error("espId and pin are required!");
  }

  publishRelayCommand(espId, pin, "MANUAL_OFF");

  return {
    message: `Turn off request sent`
  };
};





























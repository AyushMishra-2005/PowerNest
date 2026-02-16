import axios from 'axios'
import server from '../../envirnoment.js';

export const handleStatus = async (topis, payload) => {
  const parsedJsonData = JSON.parse(payload);

  const espData = {
    espId: parsedJsonData.espId,
    activePins: parsedJsonData.activePins,
  }

  try {
    const serverData = await axios.post(
      `${server}/main-server/get-active-pins`,
      espData,
    );

  } catch(err){
    console.log("server error.");
  }
}























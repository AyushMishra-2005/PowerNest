import axios from 'axios'
import server from '../envirnoment.js'

export const getRoomEspId = async (sensorEspId) => {
  try {
    const {data} = await axios.post(
      `${server}/main-server/get-roomId`,
      { sensorEspId },
    );

    console.log(data.roomEspId);

    return data.roomEspId;
  } catch (err) {
    console.error("Failed to fetch roomEspId:", err.message);
    return null;
  }
};

















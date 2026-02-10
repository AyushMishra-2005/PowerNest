import axios from 'axios'
import server from '../envirnoment.js'

export const getRoomEspId = async ({sensorEspId, pin, payload}) => {
  try {
    const {data} = await axios.post(
      `${server}/main-server/get-roomId`,
      { sensorEspId, pin, payload },
    );

    console.log(data.roomEspId);
    const newData = {
      roomEspId: data.roomEspId,
      roomEspPin: data.roomEspPin,
      mode: data.mode,
    }

    return newData;
  } catch (err) {
    console.error("Failed to fetch roomEspId:", err.message);
    return null;
  }
};

















import express from 'express';
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import userRoute from './routes/user.route.js'
import { v2 as cloudinary } from 'cloudinary';
import blockRoute from './routes/block.route.js'
import espRoute from './routes/esp.route.js'
import {app, io, server} from './SocketIO/server.js'

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const PORT = process.env.PORT || 8000;
const DB_URL = process.env.DB_URL;

const allowedOrigins =  ["http://localhost:3000", "http://localhost:9000"];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin || allowedOrigins.includes(origin)){
      callback(null, true);
    }else{
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

const main = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log("Database connected.");
  } catch (err) {
    console.log("Database Error: " + err);
  }
}
main();

app.use("/user", userRoute);
app.use("/block", blockRoute);
app.use("/esp", espRoute);

app.get("/getImage", (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  });
});

app.post('/deleteImage', async (req, res) => {
  const { publicId } = req.body;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    res.status(200).json({result});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


server.listen(PORT, () => {
  console.log("app is listening at the port: " + PORT);
});























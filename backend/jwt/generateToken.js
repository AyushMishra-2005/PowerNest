import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const createTokenAndSaveCookie = (userId, res) => {
  const token = jwt.sign(
    {userId},
    JWT_SECRET_KEY,
    {
      expiresIn: "1d"
    }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

export default createTokenAndSaveCookie;


















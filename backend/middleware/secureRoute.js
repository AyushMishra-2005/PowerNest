import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import dotenv from 'dotenv'
dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const secureRoute = async (req, res, next) => {
  try{
    const token = req.cookies.token;
    if(!token){
      return res.status(401).json({message: "User is not authorized"});
    }

    const verified = jwt.verify(token, JWT_SECRET_KEY);

    if(!verified){
      return res.status(403).json({message: "User is not verified."});
    }

    const user = await User.findById(verified.userId).select("-password");

    if(!user){
      return res.status(404).json({message: "User not found!"});
    }

    req.user = user;

    next();

  }catch(err){
    console.log("Error occured during authentication."+err);
    res.send(501).json({ message: "Internal server error" });
  }
}

export default secureRoute;















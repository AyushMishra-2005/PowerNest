import { OAuth2Client } from 'google-auth-library'
import axios from 'axios'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async (req, res, next) => {
  try{
    const {code, withGoogle} = req.body;

    if(!withGoogle){
      return next();
    }

    if(!code){
      return res.status(401).json({ message: "Invalid Code" });
    }

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'postmessage', 
        grant_type: 'authorization_code',
      }
    );

    const {id_token, access_token} = tokenRes.data;

    const ticket = await client.verifyIdToken({
      idToken : id_token,
      audience : process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    req.body = {
      ...req.body,
      name : payload.name,
      email : payload.email,
      profilePicURL: payload.picture,
      password: null,
      confirmpassword: null,
    }

    next();

  }catch(err){
    console.error("Google token verification failed:", err);
    return res.status(401).json({ message: "Invalid Google ID token" });
  }
}

export default verifyGoogleToken;





















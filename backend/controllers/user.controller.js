import User from '../models/user.model.js'
import bcrypt from 'bcrypt'
import createTokenAndSaveCookie from '../jwt/generateToken.js'
import { getTransporter } from '../config/nodemailer.config.js';
import StoreOTP from '../models/otp.model.js'

const transporter = getTransporter();

export const signup = async (req, res) => {
  try {
    let { name, email, password, profilePicURL, withGoogle } = req.body;

    if (withGoogle !== true && withGoogle !== false) {
      return res.status(400).json({ message: "Password do not match" });
    }

    if (!name || !email || !profilePicURL) {
      return res.status(400).json({ message: "Please provide valid data!" });
    }

    const user = await User.findOne({ $or: [{ email }] });

    if (user) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    let newUser;

    if (!withGoogle) {
      const hash = await bcrypt.hash(password, 10);

      newUser = new User({
        name,
        email,
        password: hash,
        profilePicURL,
      });
    } else {
      newUser = new User({
        name,
        email,
        profilePicURL,
        signupWithGoogle: true
      });
    }

    await newUser.save().then(() => {
      console.log("User saved successfully!");
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to PowerNest",
      text: `Hi ${name},

      Welcome to PowerNest — we’re excited to have you on board!

      PowerNest is built to help you monitor, control, and optimize power usage intelligently using smart automation and real-time insights. Whether you’re managing rooms, analyzing energy data, or building smarter systems, PowerNest is here to support you every step of the way.

      Here’s how you can get started:
      ⚡ Explore your dashboard to view and control connected rooms and devices.

      🏠 Set up your spaces to enable smart power automation.

      📊 Track energy usage and gain insights to improve efficiency.

      If you have any questions or need assistance, feel free to reply to this email or reach out to our support team — we’re always happy to help.

      Thanks for joining PowerNest. Let’s build a smarter and more efficient future together!

      Warm regards,  
      The PowerNest Team  
      www.powernest.io | support@powernest.io`
    }

    await transporter.sendMail(mailOptions);

    if (newUser) {
      createTokenAndSaveCookie(newUser._id, res);
      res.status(201).json({
        message: "User registered successfully.",
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          profilePicURL: newUser.profilePicURL,
        }
      });
    }

  } catch (err) {
    console.log("Error in signup : ", err);
    res.status(500).json({ message: "Server error" });
  }
}

export const login = async (req, res) => {
  try {
    const { email, password, withGoogle } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.active) {
      return res.status(404).json({ message: "Account deleted! Can not login!" });
    }

    if (!withGoogle) {
      const compPass = await bcrypt.compare(password, user.password);

      if (!compPass) {
        return res.status(404).json({ message: "Wrong password" });
      }
    }

    createTokenAndSaveCookie(user._id, res);

    res.status(201).json({
      message: "User logged in successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicURL: user.profilePicURL,
        mobileNumber: user.mobileNumber
      }
    });

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Server error" });
  }
}


export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      path: "/",
    });
    return res.status(200).json({ message: "User successfully logged out!" });
  } catch (err) {
    console.log(e);
    res.status(500).json({ message: "Server error" });
  }
}


export const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(500).json({ message: "Please provide a valid email" });
  }

  try {
    await StoreOTP.findOneAndDelete({ email });

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "AIspire Accout verification OTP",
      text: `Your OTP is ${otp}. Verify your email ID using this OTP. It is valid for 24 hours.`
    }

    const otpData = new StoreOTP({
      email,
      verifyOtp: otp,
      verifyOtpExpireAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    await otpData.save();

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "OTP send successful" });

  } catch (err) {
    console.log("Error in sendOtp : ", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }

}


export const verifyOtp = async (req, res) => {
  let { email, otp } = req.body;
  otp = otp.join('');

  if (!email || !otp) {
    return res.status(500).json({ message: "Please provide a valid email or OTP" });
  }

  try {

    const data = await StoreOTP.findOne({ email });

    let valid = false;

    if (!data) {
      return res.status(200).json({ message: "Email does not found!" });
    }

    if (data.verifyOtpExpireAt < Date.now()) {
      await StoreOTP.findOneAndDelete({ email });
      return res.status(200).json({ message: "Your OTP has been Expired!" });
    }

    if (otp === data.verifyOtp) {
      valid = true;
    }


    return res.status(200).json({ message: "OTP checked", valid });


  } catch (err) {
    console.log("error in verifyOtp : ", err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }

}






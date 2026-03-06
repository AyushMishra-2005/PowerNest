import User from '../models/user.model.js'
import bcrypt from 'bcrypt'
import createTokenAndSaveCookie from '../jwt/generateToken.js'
import StoreOTP from '../models/otp.model.js'
import { emailApi } from '../config/brevo.config.js'

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

    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL,
        name: "PowerNest"
      },
      to: [
        {
          email: email
        }
      ],
      subject: "Welcome to PowerNest",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <div style="background-color: #0f172a; padding: 20px; text-align: center;">
              <h2 style="color: #22c55e; margin: 0;">Welcome to PowerNest</h2>
            </div>

            <!-- Body -->
            <div style="padding: 25px; color: #111827; font-size: 14px; line-height: 1.6;">
              
              <p>Hi <strong style="color:#22c55e;">${name}</strong>,</p>

              <p>
              Welcome to <strong>PowerNest</strong> — we’re excited to have you on board!
              </p>

              <p>
              PowerNest helps you monitor, control, and optimize power usage intelligently using smart automation and real-time insights.
              </p>

              <div style="background:#f9fafb; padding:15px; border-left:4px solid #22c55e; border-radius:4px;">
                <p style="margin:5px 0;">
                  ⚡ Explore your dashboard to manage rooms and devices.<br/>
                  🏠 Set up spaces for smart power automation.<br/>
                  📊 Track energy usage and improve efficiency.
                </p>
              </div>

              <!-- Dashboard Button -->
              <div style="text-align:center; margin-top:25px;">
                <a href="https://powernest-self.vercel.app"
                  style="display:inline-block;
                        padding:12px 24px;
                        background:#22c55e;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:6px;
                        font-weight:bold;
                        font-size:14px;">
                  Open PowerNest Dashboard
                </a>
              </div>

              <p style="margin-top:25px;">
              If you have any questions or need assistance, feel free to contact our support team anytime.
              </p>

              <p>
              Thanks for joining <span style="color:#22c55e; font-weight:bold;">PowerNest</span>.  
              Let’s build a smarter and more efficient future together!
              </p>

              <p style="margin-top:20px;">
              Warm regards,<br/>
              <strong>PowerNest Team</strong>
              </p>

            </div>

            <!-- Footer -->
            <div style="background:#111827; color:#ffffff; text-align:center; padding:15px; font-size:12px;">
              © 2026 PowerNest | Smart Energy Automation<br/>
              <span style="color:#9ca3af;">www.powernest.io</span>
            </div>

          </div>

        </div>
        `
    });

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

    const otpData = new StoreOTP({
      email,
      verifyOtp: otp,
      verifyOtpExpireAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    await otpData.save();

    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL,
        name: "PowerNest"
      },
      to: [
        {
          email: email
        }
      ],
      subject: "PowerNest Account Verification OTP",
      textContent: `Your OTP is ${otp}. Verify your email ID using this OTP. It is valid for 24 hours.`
    });

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






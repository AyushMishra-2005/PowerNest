"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShineBorder } from "@/components/ui/shine-border"
import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Eye, EyeOff, Camera, Mail, Lock, User } from "lucide-react"
import Link from "next/link"
import axios from 'axios'
import { useAuth } from '../context/AuthProvider.jsx'
import { useGoogleLogin } from '@react-oauth/google'
import { toast } from 'react-hot-toast'
import server from "../envirnoment.js"
import Image from "next/image.js"


export function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [profilePic, setProfilePic] = useState(null)
  const [profileFile, setProfileFile] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    otp: ["", "", "", "", "", ""],
    password: "",
  })
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    otp: false,
    password: false,
  })

  const otpRefs = useRef([])
  const formContentRef = useRef(null)
  const { setAuthUser } = useAuth();

  useEffect(() => {
    otpRefs.current = otpRefs.current.slice(0, 6)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }))
    }
  }

  const handleOtpChange = (e, index) => {
    const value = e.target.value

    if (/^\d$/.test(value)) {
      const newOtp = [...formData.otp]
      newOtp[index] = value
      setFormData(prev => ({
        ...prev,
        otp: newOtp
      }))

      if (index < 5) {
        otpRefs.current[index + 1]?.focus()
      }
    } else if (value === '') {
      const newOtp = [...formData.otp]
      newOtp[index] = ''
      setFormData(prev => ({
        ...prev,
        otp: newOtp
      }))
    }

    if (errors.otp) {
      setErrors(prev => ({
        ...prev,
        otp: false
      }))
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split('')
      const paddedOtp = [...newOtp, ...Array(6 - newOtp.length).fill('')].slice(0, 6)
      setFormData(prev => ({
        ...prev,
        otp: paddedOtp
      }))

      const lastFilledIndex = Math.min(newOtp.length, 5)
      if (lastFilledIndex >= 0 && lastFilledIndex < 6) {
        setTimeout(() => {
          otpRefs.current[lastFilledIndex]?.focus()
        }, 0)
      }
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      otpRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(URL.createObjectURL(e.target.files[0]))
      setProfileFile(e.target.files[0])
    }
  }

  const handleSendOtp = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: true }))
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: true }))
      toast.error('Please enter a valid email address');
      return;
    }
    setSendingOtp(true);
    try {
      const { data } = await axios.post(
        `${server}/user/sendOTP`,
        { email: formData.email },
        { withCredentials: true }
      );
      if (data) {
        setOtpSent(true);
        toast.success('OTP sent successfully! Check your email.');
      }
    } catch (err) {
      console.error('Failed to send OTP:', err)
      toast.error('Failed to send OTP');
    } finally {
      setSendingOtp(false)
    }
  }

  const validateForm = () => {
    const newErrors = {
      name: !formData.name,
      email: !formData.email,
      otp: !formData.otp || formData.otp.length !== 6,
      password: !formData.password,
    }
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  }

  const handleGoogleSignup = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (response) => {
      try {
        const withGoogle = true;

        await axios.post(
          `${server}/user/signup`,
          { code: response.code, withGoogle },
          { withCredentials: true }
        ).then((response) => {
          if (response.data) {
            toast.success("Signup successful you can login now.");
          }
          console.log(response.data);
          localStorage.setItem("authUserData", JSON.stringify(response.data));
          setAuthUser(response.data);
        }).catch((err) => {
          console.log("Error in signup page : ", err);
          if (err.response && err.response.data) {
            toast.error(err.response.data.message);
          }
        });
      } catch (err) {
        console.log(err);
        toast.error("Error!");
      }
    }
  });

  const handleVerifyOtp = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: true }));
      return false;
    }

    if (!formData.otp || formData.otp.length !== 6) {
      setErrors(prev => ({ ...prev, otp: true }));
      toast.error('Please enter a valid 6-digit OTP');
      return false;
    }

    try {
      const { data } = await axios.post(
        `${server}/user/verifyOTP`,
        {
          email: formData.email,
          otp: formData.otp
        },
        { withCredentials: true }
      );

      console.log(data.valid);

      if (!data.valid) {
        toast.error('Invalid OTP! Please try again.');
      }
      return data.valid;
    } catch (err) {
      console.log(err);
      toast.error('OTP verification failed!');
      return false;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      if (!formData.otp || formData.otp.length !== 6) {
        toast.error('Please enter a valid 6-digit OTP');
      } else {
        toast.error('Please fill all required fields correctly');
      }
      return;
    }

    const valid = await handleVerifyOtp();

    if (!valid) {
      return;
    }

    let imageURL = "";

    if (profileFile) {
      try {
        const { data } = await axios.get(
          `${server}/getImage`,
          {},
          { withCredentials: true }
        );

        const imageFormData = new FormData();
        imageFormData.append("file", profileFile);
        imageFormData.append('api_key', data.apiKey);
        imageFormData.append('timestamp', data.timestamp);
        imageFormData.append('signature', data.signature);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`;

        const uploadRes = await axios.post(cloudinaryUrl, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        imageURL = uploadRes.data.secure_url;
      } catch (err) {
        console.log(err);
      }
    }

    const userInfo = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      profilePicURL: imageURL,
      otp: formData.otp,
      withGoogle: false,
    }

    if (!imageURL || imageURL.trim() === "") {
      const name = userInfo.name.trim();
      const encodedName = encodeURIComponent(name);
      imageURL = `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128`;
      userInfo.profilePicURL = imageURL;
    }

    await axios.post(
      `${server}/user/signup`,
      userInfo,
      { withCredentials: true }
    )
      .then((response) => {
        if (response.data) {
          toast.success("SignUp successful! You can now login.");
        }
        console.log(response.data);
        localStorage.setItem("authUserData", JSON.stringify(response.data));
        setAuthUser(response.data);
      })
      .catch((err) => {
        console.log("Error in signup page : ", err);
        if (err.response && err.response.data) {
          toast.error(err.response.data.message || "Signup failed. Please try again.");
        } else {
          toast.error("Signup failed. Please try again.");
        }
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 md:p-4 mt-12 md:mt-0 lg:mt-0">
      <Card className="relative w-full max-w-4xl overflow-hidden bg-white dark:bg-black shadow-xl h-[95vh] flex flex-col py-0">
        <ShineBorder
          shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          className="rounded-xl"
        />

        {/* Two-column layout container */}
        <div className="flex flex-col lg:flex-row flex-grow h-full overflow-hidden">
          {/* Left Column - Profile Upload & Title */}
          <div className="lg:w-2/5 p-6 md:p-4 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 flex-shrink-0">
            <div className="w-full max-w-xs text-center">
              {/* Title */}
              <div className="mb-8">
                <CardTitle className="text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-400 mb-2">
                  Create Account
                </CardTitle>
                <CardDescription className="text-sm text-gray-700 dark:text-gray-300">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-emerald-800 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 font-medium hover:underline transition-colors"
                  >
                    Sign in instead
                  </Link>
                </CardDescription>
              </div>

              {/* Profile Picture Upload */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <label htmlFor="profile-pic" className="cursor-pointer group">
                    <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-emerald-700 dark:border-emerald-400 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/30 group-hover:border-emerald-600 dark:group-hover:border-emerald-300 transition-all duration-300 shadow-lg">
                      {profilePic ? (
                        <AvatarImage src={profilePic} alt="Profile" className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-100 text-2xl">
                          <Camera className="w-10 h-10" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute bottom-2 right-2 bg-gradient-to-br from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-100 rounded-full p-2 border-4 border-white dark:border-black group-hover:scale-110 transition-transform shadow-lg">
                      <Camera className="w-4 h-4" />
                    </div>
                  </label>
                  <input
                    accept="image/*"
                    id="profile-pic"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Upload Instructions */}
              <div className="text-center">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Upload Profile Picture
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Click on the camera icon to upload your photo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Supports JPG, PNG, WEBP
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="lg:w-3/5 flex flex-col items-center justify-center h-full min-h-0">
            {/* Scrollable form content */}
            <CardContent
              ref={formContentRef}
              className="p-6 md:p-8 overflow-y-auto"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-300">
                    <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full h-10 text-sm ${errors.name ? "border-red-500" : ""} text-gray-800 dark:text-gray-300`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">This field is required</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-300">
                    <Mail className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full h-10 text-sm ${errors.email ? "border-red-500" : ""} text-gray-800 dark:text-gray-300`}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">This field is required</p>
                  )}
                </div>

                {/* OTP Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-800 dark:text-gray-300">
                    Enter 6-digit OTP
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-2 justify-between">
                      {[...Array(6)].map((_, index) => (
                        <Input
                          key={index}
                          ref={el => otpRefs.current[index] = el}
                          id={`otp-${index}`}
                          value={formData.otp[index]}
                          onChange={(e) => handleOtpChange(e, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onPaste={handleOtpPaste}
                          disabled={!otpSent}
                          className={`w-12 h-12 text-center text-lg font-semibold p-0 ${errors.otp ? "border-red-500" : ""
                            } ${!otpSent ? "bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed" : "text-gray-800 dark:text-gray-300"}`}
                          maxLength={1}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="w-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 dark:from-emerald-500 dark:via-emerald-400 dark:to-emerald-300 hover:from-emerald-800 hover:via-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:via-emerald-500 dark:hover:to-emerald-400 transition-all h-10 text-sm text-white dark:text-gray-900 font-medium"
                    >
                      {sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                    </Button>
                  </div>
                  {errors.otp && (
                    <p className="text-xs text-red-500">Please enter a valid 6-digit OTP</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-300">
                    <Lock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full h-10 text-sm pr-10 ${errors.password ? "border-red-500" : ""} text-gray-800 dark:text-gray-300`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500">This field is required</p>
                  )}
                </div>

                <Button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 dark:from-emerald-500 dark:via-emerald-400 dark:to-emerald-300 hover:from-emerald-800 hover:via-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:via-emerald-500 dark:hover:to-emerald-400 transition-all duration-300 text-white dark:text-gray-900 font-semibold text-sm h-11 shadow-md"
                >
                  CREATE ACCOUNT
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-black px-3 text-gray-500 dark:text-gray-400">
                      OR
                    </span>
                  </div>
                </div>

                {/* Google Sign Up */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors h-10 text-sm flex items-center justify-center text-gray-800 dark:text-gray-300"
                  onClick={handleGoogleSignup}
                >
                  <Image
                    src="/googleLogo.png"
                    alt="Google logo"
                    width={16}
                    height={16}
                    className="mr-2"
                  />
                  Sign up with Google
                </Button>

              </form>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  )
}
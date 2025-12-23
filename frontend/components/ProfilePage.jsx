"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthProvider"
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit,
  Save,
  Camera,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Hash,
  Lock,
} from "lucide-react"
import { toast } from "react-hot-toast"

export function ProfilePage() {
  const { authUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [profileData, setProfileData] = useState({
    name: authUser?.user?.name || "",
    email: authUser?.user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSaveProfile = () => {
    if (!profileData.name.trim()) {
      toast.error("Name cannot be empty")
      return
    }
    toast.success("Profile updated successfully")
    setIsEditing(false)
  }

  const handlePasswordChange = () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    if (profileData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    toast.success("Password changed successfully")
    setProfileData({
      ...profileData,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  const formatDate = () =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  return (
    <div className="bg-white dark:bg-black overflow-hidden mt-12 md:mt-0 lg:mt-0">
      <div className="h-full overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-400">
              Your Profile
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your personal information and account security
            </p>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* LEFT PANEL */}
            <div className="flex flex-col items-center lg:items-start gap-6">
              <div className="relative">
                <Avatar className="h-32 w-32 md:h-40 md:w-40">
                  <AvatarImage src={authUser?.user?.profilePicURL} />
                  <AvatarFallback className="text-3xl font-semibold text-gray-800 dark:text-gray-300">
                    {authUser?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="text-center lg:text-left space-y-2">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Hash className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  {authUser?.user?._id?.slice(-8)}
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-800 dark:text-gray-300">
                  <Shield className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  Active
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  {formatDate()}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="lg:col-span-2 space-y-10">
              {/* PERSONAL INFO */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
                    <User className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                    Personal Information
                  </h2>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-emerald-700 dark:text-emerald-400"
                  >
                    {isEditing ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>

                {isEditing ? (
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label className="text-gray-600 dark:text-gray-400">
                        Full Name
                      </Label>
                      <Input
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, name: e.target.value })
                        }
                        className="border-emerald-200 dark:border-emerald-800"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-600 dark:text-gray-400">
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        className="border-emerald-200 dark:border-emerald-800"
                      />
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <User className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Name
                        </p>
                        <p className="font-medium text-gray-800 dark:text-gray-300">
                          {authUser?.user?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Mail className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Email
                        </p>
                        <p className="font-medium text-gray-800 dark:text-gray-300">
                          {authUser?.user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <div className="h-px bg-emerald-200 dark:bg-emerald-800" />

              {/* PASSWORD */}
              <section className="space-y-4 max-w-lg">
                <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  Change Password
                </h2>

                <div>
                  <Label className="text-gray-600 dark:text-gray-400 mb-2">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={profileData.currentPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="border-emerald-200 dark:border-emerald-800"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700 dark:text-emerald-400"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400 mb-2">
                      New Password
                    </Label>
                    <Input
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          newPassword: e.target.value,
                        })
                      }
                      className="border-emerald-200 dark:border-emerald-800"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-600 dark:text-gray-400 mb-2">
                      Confirm Password
                    </Label>
                    <Input
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="border-emerald-200 dark:border-emerald-800"
                    />
                  </div>
                </div>

                <Button
                  onClick={handlePasswordChange}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

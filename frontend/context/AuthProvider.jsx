"use client"

import React, { createContext, useState, useContext, useEffect } from "react"
import Cookies from "js-cookies"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(undefined)

  useEffect(() => {
    const storedUser =
      localStorage.getItem("authUserData") || Cookies.getItem("jwt")

    if (storedUser) {
      setAuthUser(JSON.parse(storedUser))
    }
  }, [])

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

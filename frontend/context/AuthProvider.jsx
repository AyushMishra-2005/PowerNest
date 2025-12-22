"use client"

import React, { createContext, useState, useContext, useEffect } from "react"
import Cookies from "js-cookies"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("authUserData") || Cookies.getItem("jwt")

    if (storedUser) {
      setAuthUser(JSON.parse(storedUser))
    }
    setLoading(false);
  }, [])

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

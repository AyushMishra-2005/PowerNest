"use client"

import React from "react"
import { useState, useEffect, useContext, createContext, useRef } from "react"
import { useAuth } from './AuthProvider.jsx'
import server from '../envirnoment.js'
import { io } from 'socket.io-client'

const socketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { authUser } = useAuth();

  useEffect(() => {
    if (!authUser) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(
      `${server}`,
      {
        query: {
          userId: authUser.user._id
        }
      }
    );

    newSocket.on("connect", () => {
      console.log("Socket connected with ID: ", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    newSocket.on("security_alert_voice", (data) => {
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);

      audio.onended = () => {
        audio.src = "";
      };

      audio.play().catch(() => { });
    });

    setSocket(newSocket);

    return () => {
      newSocket.off("security_alert_voice");
      newSocket.disconnect();
    };

  }, [authUser]);

  return (
    <socketContext.Provider value={{ socket }}>
      {children}
    </socketContext.Provider>
  );
}

export const useSocketContext = () => useContext(socketContext);

























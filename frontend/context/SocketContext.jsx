"use client"

import React from "react"
import { useState, useEffect, useContext, createContext, useRef } from "react"
import {useAuth} from './AuthProvider.jsx'
import server from '../envirnoment.js'
import {io} from 'socket.io-client'

const socketContext = createContext();

export const SocketProvider = ({children}) => {
  const [socket, setSocket] = useState(null);
  const {authUser} = useAuth();
  const userIdRef = useRef(null);

  useEffect(() => {
    if(!authUser){
      if(socket){
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const initializeSocket = () => {
      const newSocket = io(
        `${server}`,
        {
          query:{
            userId: authUser.user._id
          }
        }
      );

      newSocket.on("connect", () => {
        console.log("Socket connected with ID: ", newSocket.id);
        userIdRef.current = authUser.user._id;
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      return newSocket;
    }

    if(!socket){
      const newSocket = initializeSocket();
      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
      }
    }

    if(socket && userIdRef.current !== authUser.user._id){
      socket.disconnect();
      const newSocket = initializeSocket();
      setSocket(newSocket);
    }

    return () => {};

  }, [authUser]);

  return(
    <socketContext.Provider value={{socket}}>
      {children}
    </socketContext.Provider>
  );
}

export const useSocketContext = () => useContext(socketContext);

























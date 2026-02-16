"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Activity, Cpu, Link2, Save, Zap, Settings, ArrowLeft, Clock, Power, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import useBlockStore from "@/store/blockStore"
import { useMemo } from "react"
import server from '../envirnoment.js'
import axios from "axios"
import { toast } from 'react-hot-toast'
import { useSocketContext } from '../context/SocketContext.jsx'
import { ShinyButton } from "@/components/ui/shiny-button"
import useEspDataStore from "../store/espDataStore.js"
import useBlockData from "../store/blockData.js"

export function ESPConnectionPage({ blockId }) {
  const router = useRouter();
  const { blocks } = useBlockStore();
  const { socket } = useSocketContext();
  const { setAllEspData } = useEspDataStore();
  const { setBlockData } = useBlockData();
  const connectionRef = useRef([]);

  const roomData = useMemo(() => {
    return blocks.find(b => b._id.toString() === blockId);
  }, [blocks, blockId]);

  useEffect(() => {
    if (!blocks?.length || !roomData) {
      return router.replace("/dashboard");
    }
  }, [blocks, roomData, router]);

  const [sensorESPStatus, setSensorESPStatus] = useState("active")
  const [roomESPStatus, setRoomESPStatus] = useState("active")
  const [selectedSensorPin, setSelectedSensorPin] = useState("")
  const [selectedRoomPin, setSelectedRoomPin] = useState("")
  const [selectedConnectionMode, setSelectedConnectionMode] = useState("auto")
  const [connections, setConnections] = useState([])
  const [availableSensorEspPins, setAvailableSensorEspPins] = useState([]);
  const [availableRoomEspPins, setAvailableRoomEspPins] = useState([]);
  const [roomNumber, setRoomNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [connectionModes, setConnectionModes] = useState({});
  const [connectionPowerStates, setConnectionPowerStates] = useState({});

  const [displayStatuses, setDisplayStatuses] = useState({});

  useEffect(() => {
    connectionRef.current = connections;
  },[connections]);

  useEffect(() => {
    if (!blockId) return;
    const getEspData = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.post(
          `${server}/esp/get-esp-data`,
          { blockId },
          { withCredentials: true }
        );
        if (data.data) {
          setAvailableSensorEspPins(data.data.availableSensorEspPins);
          setAvailableRoomEspPins(data.data.availableRoomEspPins);
          setAllEspData(data.data);

          const processedConnections = data.data.connectedPins.map((pin) => {
            const lastActiveAt = pin.lastActiveAt
              ? new Date(pin.lastActiveAt)
              : null;

            const activeStartedAt = pin.activeStartedAt
              ? new Date(pin.activeStartedAt)
              : null;

            let displayLastActiveAt = lastActiveAt;

            if (
              activeStartedAt &&
              (!lastActiveAt || activeStartedAt > lastActiveAt)
            ) {
              displayLastActiveAt = activeStartedAt;
            }

            return {
              id: pin._id,
              sensorPin: `D${pin.sensorEspPin}`,
              roomPin: `D${pin.roomEspPin}`,
              status: pin.status,
              roomNumber: pin.roomNumber,
              isBlocked: pin.isBlocked,
              lastActiveAt: displayLastActiveAt,
              mode: pin.mode
            };
          });

          setConnections(processedConnections);

          const modes = {};
          const powerStates = {};
          processedConnections.forEach(conn => {
            modes[conn.id] = conn.mode;
            powerStates[conn.id] = false;
          });
          setConnectionModes(modes);
          setConnectionPowerStates(powerStates);
        }
      } catch (error) {
        console.error("Error fetching ESP data:", error);
        toast.error("Failed to load ESP data");
      } finally {
        setIsLoading(false);
      }
    }
    getEspData();
  }, [blockId]);

  useEffect(() => {
    if (!socket) return;

    const handleActiveEvent = (message) => {
      const { sensorEspPin, activeStartedAt, connectionId } = message;

      setConnections((prev) =>
        prev.map((conn) =>
          conn.sensorPin === `D${sensorEspPin}` && conn.id === connectionId
            ? {
              ...conn,
              status: "connected",
              lastActiveAt: activeStartedAt,
            }
            : conn
        )
      );
    };

    const handleStoppedEvent = (message) => {
      const { sensorEspPin, lastActiveAt, connectionId } = message;

      setConnections((prev) =>
        prev.map((conn) =>
          conn.sensorPin === `D${sensorEspPin}` && conn.id === connectionId
            ? {
              ...conn,
              status: "inactive",
              lastActiveAt
            }
            : conn
        )
      );
    };

    const handleActiveRoomPins = (message) => {
      const {activePins, currBlockId} = message;

      if(currBlockId !== blockId) return;

      const initialDisplay = {};

      connectionRef.current.forEach(conn => {
        const roomPinNumber = Number(conn.roomPin.replace("D", ""));
        if(activePins.includes(roomPinNumber)){
          initialDisplay[conn.id] = "connected";
        }
      });

      setDisplayStatuses(initialDisplay);
    }

    const handleConnectionError = (message) => {
      toast.error(`Connection error: ${message}`);
    };

    socket.on("active", handleActiveEvent);
    socket.on("stopped", handleStoppedEvent);
    socket.on("active_pins", handleActiveRoomPins);
    socket.on("connection_error", handleConnectionError);
    

    return () => {
      socket.off("active", handleActiveEvent);
      socket.off("stopped", handleStoppedEvent);
      socket.off("active-pins", handleActiveRoomPins);
      socket.off("connection_error", handleConnectionError);
    };

  }, [socket]);

  const handleMakeConnection = async () => {
    if (selectedSensorPin && selectedRoomPin && roomNumber) {
      setIsLoading(true);
      const pinDetails = {
        sensorEspPin: Number(selectedSensorPin),
        roomEspPin: Number(selectedRoomPin),
        roomNumber,
        blockId,
        connectionMode: selectedConnectionMode,
      };
      console.log(selectedConnectionMode);
      try {
        const { data } = await axios.post(
          `${server}/esp/add-pin`,
          pinDetails,
          { withCredentials: true }
        );
        toast.success("Pins connected successfully!");
        if (data.data) {
          setAvailableSensorEspPins(data.data.availableSensorEspPins);
          setAvailableRoomEspPins(data.data.availableRoomEspPins);
          setAllEspData(data.data);

          const processedConnections = data.data.connectedPins.map((pin) => {
            const lastActiveAt = pin.lastActiveAt
              ? new Date(pin.lastActiveAt)
              : null;

            const activeStartedAt = pin.activeStartedAt
              ? new Date(pin.activeStartedAt)
              : null;

            let displayLastActiveAt = lastActiveAt;

            if (
              activeStartedAt &&
              (!lastActiveAt || activeStartedAt > lastActiveAt)
            ) {
              displayLastActiveAt = activeStartedAt;
            }

            return {
              id: pin._id,
              sensorPin: `D${pin.sensorEspPin}`,
              roomPin: `D${pin.roomEspPin}`,
              status: pin.status,
              roomNumber: pin.roomNumber,
              isBlocked: pin.isBlocked,
              lastActiveAt: displayLastActiveAt,
            };
          });

          setConnections(processedConnections);

          const newConnectionId = processedConnections[processedConnections.length - 1]?.id;
          if (newConnectionId) {
            setConnectionModes(prev => ({ ...prev, [newConnectionId]: selectedConnectionMode }));
            setConnectionPowerStates(prev => ({ ...prev, [newConnectionId]: false }));
          }
        }
        setSelectedSensorPin("");
        setSelectedRoomPin("");
        setRoomNumber("");
        setSelectedConnectionMode("auto");
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to establish connection";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleRemoveConnection = async (id) => {
    if (confirm("Are you sure you want to remove this connection?")) {
      try {
        const { data } = await axios.post(
          `${server}/esp/remove-connection`,
          { blockId, connectionId: id },
          { withCredentials: true }
        );

        toast.success("Connection removed successfully");
        if (data.data) {
          setAvailableSensorEspPins(data.data.availableSensorEspPins);
          setAvailableRoomEspPins(data.data.availableRoomEspPins);
          setAllEspData(data.data);

          const processedConnections = data.data.connectedPins.map((pin) => {
            const lastActiveAt = pin.lastActiveAt
              ? new Date(pin.lastActiveAt)
              : null;

            const activeStartedAt = pin.activeStartedAt
              ? new Date(pin.activeStartedAt)
              : null;

            let displayLastActiveAt = lastActiveAt;

            if (
              activeStartedAt &&
              (!lastActiveAt || activeStartedAt > lastActiveAt)
            ) {
              displayLastActiveAt = activeStartedAt;
            }

            return {
              id: pin._id,
              sensorPin: `D${pin.sensorEspPin}`,
              roomPin: `D${pin.roomEspPin}`,
              status: pin.status,
              roomNumber: pin.roomNumber,
              isBlocked: pin.isBlocked,
              lastActiveAt: displayLastActiveAt,
              mode: pin.mode,
            };
          });

          setConnections(processedConnections);

          const modes = {};
          const powerStates = {};
          processedConnections.forEach(conn => {
            modes[conn.id] = conn.mode;
            powerStates[conn.id] = false;
          });
          setConnectionModes(modes);
          setConnectionPowerStates(powerStates);
        }
      } catch (err) {
        const message = err?.response?.data?.message ||
          err?.message || "Failed to remove connection";
        toast.error(message);
      }
    }
  }

  const handleToggleBlock = async ({ id, blockStatus }) => {
    try {
      const { data } = await axios.post(
        `${server}/esp/block-connection`,
        { blockId, connectionId: id, blockStatus },
        { withCredentials: true }
      );

      toast.success(data.message);
      if (data.data) {
        setAvailableSensorEspPins(data.data.availableSensorEspPins);
        setAvailableRoomEspPins(data.data.availableRoomEspPins);
        setAllEspData(data.data);

        const processedConnections = data.data.connectedPins.map((pin) => {
          const lastActiveAt = pin.lastActiveAt
            ? new Date(pin.lastActiveAt)
            : null;

          const activeStartedAt = pin.activeStartedAt
            ? new Date(pin.activeStartedAt)
            : null;

          let displayLastActiveAt = lastActiveAt;

          if (
            activeStartedAt &&
            (!lastActiveAt || activeStartedAt > lastActiveAt)
          ) {
            displayLastActiveAt = activeStartedAt;
          }

          return {
            id: pin._id,
            sensorPin: `D${pin.sensorEspPin}`,
            roomPin: `D${pin.roomEspPin}`,
            status: pin.status,
            roomNumber: pin.roomNumber,
            isBlocked: pin.isBlocked,
            lastActiveAt: displayLastActiveAt,
            mode: pin.mode,
          };
        });

        setConnections(processedConnections);

        const modes = {};
        const powerStates = {};
        processedConnections.forEach(conn => {
          modes[conn.id] = conn.mode;
          powerStates[conn.id] = false;
        });
        setConnectionModes(modes);
        setConnectionPowerStates(powerStates);
      }
    } catch (err) {
      const message = err?.response?.data?.message ||
        err?.message || "Failed to update connection";
      toast.error(message);
    }
  }

  const handleSaveConfiguration = () => {
    console.log("Saving ESP configuration:", {
      sensorESPStatus,
      roomESPStatus,
      connections
    });

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Configuration saved successfully!");
    }, 500);
  }

  const handleAnalyticsClick = (id) => {
    setBlockData(roomData);
    router.replace(`/analytics/${id}`);
  }

  const toggleConnectionMode = async (connectionId) => {

    try {
      const { data } = await axios.post(
        `${server}/esp/toggle-connection`,
        { blockId, connectionId, connectionMode: connectionModes[connectionId] },
        { withCredentials: true }
      );

      if (data.mode) {
        setConnectionModes(prev => ({
          ...prev,
          [connectionId]: data.mode
        }));
        toast.success(data.message);
      }

    } catch (err) {
      const message = err?.response?.data?.message ||
        err?.message || "Failed to toggle connection";
      toast.error(message);
    }



  }

  const togglePowerState = (connectionId) => {
    setConnectionPowerStates(prev => ({
      ...prev,
      [connectionId]: !prev[connectionId]
    }));
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header - Same for all screen sizes */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-black backdrop-blur-sm mt-12 md:mt-0 lg:mt-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard`)}
                className="self-start sm:self-center text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-400 truncate">
                    ESP Connection Setup
                  </h1>
                  {roomData?.blockName && (
                    <span className="text-lg sm:text-xl font-semibold text-emerald-700 dark:text-emerald-300">
                      • {roomData.blockName}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  Configure and manage connections between Sensor ESP and Room ESP
                </p>
              </div>
            </div>

            <Button
              onClick={handleSaveConfiguration}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-900 font-medium h-10 sm:h-12 rounded-lg flex items-center justify-center group hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 shadow-lg transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:px-8">
          {isLoading && (
            <div className="fixed inset-0 bg-black/20 dark:bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="mt-4 text-emerald-700 dark:text-emerald-400">Loading...</p>
              </div>
            </div>
          )}

          {/* Responsive Grid - Single column on small screens, 3 columns on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - ESP Status - Full width on mobile, 1/3 on desktop */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Sensor ESP Status Card */}
              <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      Sensor ESP Status
                    </CardTitle>
                    <Badge className={
                      sensorESPStatus === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : sensorESPStatus === "testing"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }>
                      {sensorESPStatus === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="text-emerald-800 dark:text-emerald-300">
                    <b>ESP_ID:</b> {roomData?.sensorEspId || "Not configured"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Available Pins:</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {availableSensorEspPins.length} pins
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableSensorEspPins.map(pin => (
                        <Badge key={pin} variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700">
                          D{pin}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Room ESP Status Card */}
              <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      Room ESP Status
                    </CardTitle>
                    <Badge className={
                      roomESPStatus === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : roomESPStatus === "testing"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }>
                      {roomESPStatus === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="text-emerald-800 dark:text-emerald-300">
                    <b>ESP_ID:</b> {roomData?.roomEspId || "Not configured"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Available Pins:</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {availableRoomEspPins.length} pins
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableRoomEspPins.map(pin => (
                        <Badge key={pin} variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700">
                          D{pin}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Pin Configuration & Connections - Full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Connection Setup Card */}
              <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Pin Configuration
                  </CardTitle>
                  <CardDescription className="text-emerald-800 dark:text-emerald-300">
                    Map pins between Sensor ESP and Room ESP
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* MODIFIED: two columns on small screens and up, one column on very small */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-3 sm:p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
                    {/* Sensor ESP Pin Selection */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-emerald-900 dark:text-emerald-400 text-sm sm:text-base">
                          Sensor Pins
                        </h3>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                          Output
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Select Pin for Connection
                        </label>
                        <Select value={selectedSensorPin} onValueChange={setSelectedSensorPin}>
                          <SelectTrigger className="border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900">
                            <SelectValue placeholder="Select sensor pin" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800 max-h-60">
                            {availableSensorEspPins.map(pin => (
                              <SelectItem key={`sensor-${pin}`} value={pin} className="text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                                Pin D{pin} (GPIO)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                        <p>Available pins for PIR sensor</p>
                      </div>
                    </div>

                    {/* Room ESP Pin Selection */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-emerald-900 dark:text-emerald-400 text-sm sm:text-base">
                          Room Pins
                        </h3>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                          Input
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Select Pin for Connection
                        </label>
                        <Select value={selectedRoomPin} onValueChange={setSelectedRoomPin}>
                          <SelectTrigger className="border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 w-[147px] sm:w-[155px] md:w-[155px] lg:w-[155px]">
                            <SelectValue placeholder="Select room pin" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800 max-h-60">
                            {availableRoomEspPins.map(pin => (
                              <SelectItem key={`room-${pin}`} value={pin} className="text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                                Pin D{pin} (GPIO)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                        <p>Available pins for relay control</p>
                      </div>
                    </div>

                    {/* Room Number Input */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-emerald-900 dark:text-emerald-400 text-sm sm:text-base">
                          Room Details
                        </h3>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                          Info
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Room Number
                        </label>
                        <br />
                        <input
                          type="text"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          placeholder="room number"
                          className="px-3 py-2 sm:py-1.5 md:py-1.5 lg:py-1.5 text-sm sm:text-base border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 rounded-md text-emerald-900 dark:text-emerald-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-[147px] sm:w-[155px] md:w-[155px] lg:w-[155px]"
                        />
                      </div>

                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                        <p>Enter the room number/name</p>
                      </div>
                    </div>

                    {/* Connection Mode Selection */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-emerald-900 dark:text-emerald-400 text-sm sm:text-base">
                          Connection
                        </h3>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                          Mode
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Select Mode
                        </label>
                        <Select value={selectedConnectionMode} onValueChange={setSelectedConnectionMode}>
                          <SelectTrigger className="border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 w-[147px] sm:w-[155px] md:w-[155px] lg:w-[155px]">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800">
                            <SelectItem value="auto" className="text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                              Automatic
                            </SelectItem>
                            <SelectItem value="manual" className="text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                              Manual
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                        <p>Auto or manual control</p>
                      </div>
                    </div>
                  </div>

                  {/* Make Connection Button */}
                  <div className="flex justify-center mt-4 sm:mt-6">
                    <Button
                      onClick={handleMakeConnection}
                      disabled={!selectedSensorPin || !selectedRoomPin || !roomNumber || isLoading}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 text-white dark:text-gray-900 shadow-lg px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <Link2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                      {isLoading ? "Connecting..." : "Make Connection"}
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 ml-2 sm:ml-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Active Connections Card */}
              <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-5 w-5 text-emerald-900 dark:text-emerald-400" />
                      <CardTitle className="text-emerald-900 dark:text-emerald-400">
                        Active Connections
                      </CardTitle>
                      <Badge className="ml-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {connections.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-900 dark:text-emerald-400">Active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-red-900 dark:text-red-400">Blocked</span>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-emerald-800 dark:text-emerald-300">
                    {connections.length} established connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connections.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                        <Link2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No connections yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto text-sm sm:text-base">
                        Create your first connection by selecting pins above and clicking "Make Connection"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2">
                      {connections.map(connection => (
                        <div
                          key={connection.id}
                          className="flex flex-col p-3 sm:p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all duration-200"
                        >
                          <div className="flex items-start gap-3 sm:gap-4 mb-3">
                            {/* Users icon - reflects real connection.status */}
                            <Users
                              className={`h-4 w-4 sm:h-5 sm:w-5 mt-1 sm:mt-1.5 ${connection.status === "connected"
                                ? "text-blue-700"
                                : "text-gray-400"
                                }`}
                            />
                            {/* Dot - uses displayStatuses (demo data) */}
                            <div className={`h-3 w-3 rounded-full mt-1 sm:mt-1.5 ${connection.isBlocked ? "bg-red-500 animate-pulse" : displayStatuses[connection.id] === "connected"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-gray-400"
                              }`} />
                            <div className="w-full min-w-0">
                              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 mb-1">
                                <span className={`font-medium text-sm sm:text-base ${connection.isBlocked ? "text-red-700 dark:text-red-400" : "text-emerald-900 dark:text-emerald-400"}`}>
                                  Sensor Pin: {connection.sensorPin}
                                </span>
                                <span className="hidden sm:inline text-gray-400 dark:text-gray-500">→</span>
                                <span className={`font-medium text-sm sm:text-base ${connection.isBlocked ? "text-red-700 dark:text-red-400" : "text-emerald-900 dark:text-emerald-400"}`}>
                                  Room Pin: {connection.roomPin}
                                </span>
                                {connection.roomNumber && (
                                  <>
                                    <span className="hidden sm:inline text-gray-400 dark:text-gray-500">|</span>
                                    <span className={`font-medium text-sm sm:text-base ${connection.isBlocked ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                                      Room: {connection.roomNumber}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Last Active Time Section */}
                              <div className="mt-2 mb-3">
                                <div className="flex items-center text-xs sm:text-sm">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 dark:text-gray-500" />
                                  <span className="text-gray-600 dark:text-gray-400 mr-1 sm:mr-2">Last active:</span>
                                  <span className={`font-medium ${connection.lastActiveAt
                                    ? "text-gray-800 dark:text-gray-300"
                                    : "text-gray-500 dark:text-gray-500"}`}>
                                    {connection.lastActiveAt
                                      ? new Date(connection.lastActiveAt).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })
                                      : "Not activated yet"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                {/* Badge uses displayStatuses */}
                                <span className={`px-2 py-1 rounded ${connection.isBlocked
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  : displayStatuses[connection.id] === "connected"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  }`}>
                                  {
                                    connection.isBlocked
                                      ? "Blocked"
                                      : displayStatuses[connection.id] === "connected"
                                        ? "Active"
                                        : "Inactive"
                                  }
                                </span>
                                <span className={`px-2 py-1 rounded ${connectionModes[connection.id] === "auto"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                  }`}>
                                  {connectionModes[connection.id] === "auto" ? "Auto" : "Manual"}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">•</span>
                                <span className="text-gray-600 dark:text-gray-400 truncate">ID: {connection.id.slice(-8)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                            {/* Block Switch */}
                            <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/30 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-emerald-100 dark:border-emerald-800/50">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Block</span>
                              <Switch
                                checked={connection.isBlocked}
                                onCheckedChange={() =>
                                  handleToggleBlock({
                                    id: connection.id,
                                    blockStatus: !connection.isBlocked
                                  })
                                }
                                className={`data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-emerald-500 cursor-pointer transition-colors duration-200`}
                              />
                            </div>

                            {/* Mode Toggle Switch */}
                            <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/30 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-emerald-100 dark:border-emerald-800/50">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {connectionModes[connection.id] === "auto" ? "Auto" : "Manual"}
                              </span>
                              <Switch
                                checked={connectionModes[connection.id] === "manual"}
                                onCheckedChange={() => toggleConnectionMode(connection.id)}
                                className={`${connectionModes[connection.id] === "auto"
                                  ? "data-[state=unchecked]:bg-purple-500"
                                  : "data-[state=checked]:bg-orange-500"
                                  } cursor-pointer transition-colors duration-200`}
                              />
                            </div>

                            {/* Power On/Off Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePowerState(connection.id)}
                              disabled={connectionModes[connection.id] === "auto"}
                              className={`
                                px-2 sm:px-3 py-1.5 h-auto text-xs sm:text-sm
                                transition-all duration-200
                                ${connectionModes[connection.id] === "auto"
                                  ? "opacity-40 cursor-not-allowed border border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600"
                                  : connectionPowerStates[connection.id]
                                    ? "border border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                    : "border border-gray-600 dark:border-gray-400 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                                }
                              `}
                            >
                              <Power className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {connectionPowerStates[connection.id] ? "ON" : "OFF"}
                            </Button>

                            {/* Analytics Button */}
                            <ShinyButton
                              size="sm"
                              className="bg-gradient-to-r from-emerald-400/10 to-emerald-500/10 hover:from-emerald-400/20 hover:to-emerald-500/20 dark:from-emerald-800/20 dark:to-emerald-700/20 dark:hover:from-emerald-700/30 dark:hover:to-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600 cursor-pointer transition-all duration-200 px-2 sm:px-3 py-1.5 h-auto text-xs sm:text-sm"
                              onClick={() => handleAnalyticsClick(connection.id)}
                            >
                              Analytics
                            </ShinyButton>

                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveConnection(connection.id)}
                              className="
                                border border-red-600 dark:border-red-400
                                text-red-600 dark:text-red-400
                                hover:text-red-800 dark:hover:text-red-300
                                hover:bg-red-50 dark:hover:bg-red-900/20
                                cursor-pointer
                                px-2 sm:px-3 py-1.5
                                h-auto
                                text-xs sm:text-sm
                                transition-colors duration-200"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-emerald-200 dark:border-emerald-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Connection Status:</span>
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          {connections.filter(c => !c.isBlocked && c.status === "connected").length} active
                        </span>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-red-700 dark:text-red-400">
                          {connections.filter(c => c.isBlocked).length} blocked
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Real-time updates via WebSocket
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
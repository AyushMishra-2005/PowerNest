"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch" // Add Switch import
import { Activity, Cpu, Link2, Save, Zap, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import useBlockStore from "@/store/blockStore"
import { useMemo } from "react"
import server from '../envirnoment.js'
import axios from "axios"
import { toast } from 'react-hot-toast'
import { useSocketContext } from '../context/SocketContext.jsx'

export function ESPConnectionPage({ blockId }) {
  const router = useRouter();
  const { blocks } = useBlockStore();
  const { socket } = useSocketContext();

  const roomData = useMemo(() => {
    return blocks.find(b => b._id.toString() === blockId);
  }, [blocks, blockId]);

  useEffect(() => {
    if (!blocks?.length || !roomData) {
      return router.replace("/dashboard");
    }
  }, [blocks, roomData, router]);

  const [sensorESPStatus, setSensorESPStatus] = useState("active")
  const [roomESPStatus, setRoomESPStatus] = useState("inactive")
  const [selectedSensorPin, setSelectedSensorPin] = useState("")
  const [selectedRoomPin, setSelectedRoomPin] = useState("")
  const [connections, setConnections] = useState([])
  const [availableSensorEspPins, setAvailableSensorEspPins] = useState([]);
  const [availableRoomEspPins, setAvailableRoomEspPins] = useState([]);
  const [roomNumber, setRoomNumber] = useState("");

  useEffect(() => {
    const getEspData = async () => {
      const { data } = await axios.post(
        `${server}/esp/get-esp-data`,
        { blockId },
        { withCredentials: true }
      );
      if (data.data) {
        setAvailableSensorEspPins(data.data.availableSensorEspPins);
        setAvailableRoomEspPins(data.data.availableRoomEspPins);
        setConnections(
          data.data.connectedPins.map(pin => ({
            id: pin._id,
            sensorPin: `D${pin.sensorEspPin}`,
            roomPin: `D${pin.roomEspPin}`,
            status: pin.status,
            roomNumber: pin.roomNumber,
            isBlocked: pin.isBlocked,
            lastActiveAt: pin.lastActiveAt
          }))
        );
      }
    }
    getEspData();
  }, [setAvailableSensorEspPins, setAvailableRoomEspPins]);

  useEffect(() => {
    if (!socket) return;

    const handleActiveEvent = (message) => {
      const { sensorEspPin } = message;

      setConnections((prev) =>
        prev.map((conn) =>
          conn.sensorPin === `D${sensorEspPin}`
            ? { ...conn, status: "connected" }
            : conn
        )
      );
    };

    const handleStoppedEvent = (message) => {
      const { sensorEspPin } = message;

      setConnections((prev) =>
        prev.map((conn) =>
          conn.sensorPin === `D${sensorEspPin}`
            ? { ...conn, status: "inactive" }
            : conn
        )
      );
    };


    socket.on("active", handleActiveEvent);

    socket.on("stopped", handleStoppedEvent);

    return () => {
      socket.off("active", handleActiveEvent);
      socket.off("stopped", handleStoppedEvent);
    }

  }, [socket]);

  const handleMakeConnection = async () => {
    if (selectedSensorPin && selectedRoomPin && roomNumber) {
      const pinDetails = {
        sensorEspPin: Number(selectedSensorPin),
        roomEspPin: Number(selectedRoomPin),
        roomNumber,
        blockId,
      };

      try {
        const { data } = await axios.post(
          `${server}/esp/add-pin`,
          pinDetails,
          { withCredentials: true }
        );
        toast.success("pins connected");
        if (data.data) {
          setAvailableSensorEspPins(data.data.availableSensorEspPins);
          setAvailableRoomEspPins(data.data.availableRoomEspPins);
          setConnections(
            data.data.connectedPins.map(pin => ({
              id: pin._id,
              sensorPin: `D${pin.sensorEspPin}`,
              roomPin: `D${pin.roomEspPin}`,
              status: pin.status,
              roomNumber: pin.roomNumber,
              isBlocked: pin.isBlocked,
              lastActiveAt: pin.lastActiveAt
            }))
          );
        }
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong";

        toast.error(message);
      }

      setSelectedSensorPin("")
      setSelectedRoomPin("")
      setRoomNumber("");
    }
  }

  const handleRemoveConnection = async (id) => {
    try {
      const { data } = await axios.post(
        `${server}/esp/remove-connection`,
        { blockId, connectionId: id },
        { withCredentials: true }
      );

      toast.success("connection removed");
      if (data.data) {
        setAvailableSensorEspPins(data.data.availableSensorEspPins);
        setAvailableRoomEspPins(data.data.availableRoomEspPins);
        setConnections(
          data.data.connectedPins.map(pin => ({
            id: pin._id,
            sensorPin: `D${pin.sensorEspPin}`,
            roomPin: `D${pin.roomEspPin}`,
            status: pin.status,
            roomNumber: pin.roomNumber,
            isBlocked: pin.isBlocked, 
            lastActiveAt: pin.lastActiveAt
          }))
        );
      }
    } catch (err) {
      const message = err?.response?.data?.message ||
        err?.message || "Something went wrong";
      toast.error(message);
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
        setConnections(
          data.data.connectedPins.map(pin => ({
            id: pin._id,
            sensorPin: `D${pin.sensorEspPin}`,
            roomPin: `D${pin.roomEspPin}`,
            status: pin.status,
            roomNumber: pin.roomNumber,
            isBlocked: pin.isBlocked, 
            lastActiveAt: pin.lastActiveAt
          }))
        );
      }
    } catch (err) {
      const message = err?.response?.data?.message ||
        err?.message || "Something went wrong";
      toast.error(message);
    }
  }

  const handleSaveConfiguration = () => {
    console.log("Saving ESP configuration:", {
      sensorESPStatus,
      roomESPStatus,
      connections
    })

    setTimeout(() => {
      alert("Configuration saved successfully!")
    }, 500)
  }

  const handleTestConnection = (type) => {
    console.log(`Testing ${type} ESP connection...`)

    if (type === "sensor") {
      setSensorESPStatus("testing")
      setTimeout(() => setSensorESPStatus("active"), 1000)
    } else {
      setRoomESPStatus("testing")
      setTimeout(() => setRoomESPStatus("active"), 1000)
    }
  }

  return (
    <div className="h-[100vh] bg-gradient-to-br bg-white dark:bg-black overflow-hidden flex flex-col">
      <div className="px-6 md:px-8 py-6 border-b border-emerald-200 dark:border-emerald-800 flex-shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-400">
                  ESP Connection Setup
                </h1>
                {roomData?.blockName && (
                  <span className="text-lg md:text-xl font-semibold text-emerald-700 dark:text-emerald-300">
                    • {roomData.blockName}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure and manage connections between Sensor ESP and Room ESP
              </p>
            </div>
          </div>

          <Button
            onClick={handleSaveConfiguration}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-900 font-medium h-12 rounded-lg flex justify-center group/modal-btn hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 shadow-lg transition-all duration-300 cursor-pointer"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - ESP Status */}
            <div className="lg:col-span-1 space-y-6">
              {/* Sensor ESP Status Card */}
              <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all">
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
                      {sensorESPStatus === "active" ? "Active" :
                        sensorESPStatus === "testing" ? "Testing..." : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="text-emerald-800 dark:text-emerald-300">
                    <b>ESP_ID:</b> {roomData?.sensorEspId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection("sensor")}
                    className="w-full mt-4 border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </CardContent>
              </Card>

              {/* Room ESP Status Card */}
              <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all">
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
                      {roomESPStatus === "active" ? "Active" :
                        roomESPStatus === "testing" ? "Testing..." : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="text-emerald-800 dark:text-emerald-300">
                    <b>ESP_ID:</b> {roomData?.roomEspId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection("room")}
                    className="w-full mt-4 border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Pin Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Connection Setup Card */}
              <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
                    {/* Sensor ESP Pin Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-emerald-900 dark:text-emerald-400">
                          Sensor ESP Pins
                        </h3>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
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
                          <SelectContent className="bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800">
                            {availableSensorEspPins.map(pin => (
                              <SelectItem key={`sensor-${pin}`} value={pin} className="text-emerald-800 dark:text-emerald-300">
                                Pin D{pin} (GPIO)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        <p>Available pins for PIR sensor</p>
                      </div>
                    </div>

                    {/* Room ESP Pin Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-emerald-900 dark:text-emerald-400">
                          Room ESP Pins
                        </h3>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Input
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Select Pin for Connection
                        </label>
                        <Select value={selectedRoomPin} onValueChange={setSelectedRoomPin}>
                          <SelectTrigger className="border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900">
                            <SelectValue placeholder="Select room pin" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800">
                            {availableRoomEspPins.map(pin => (
                              <SelectItem key={`room-${pin}`} value={pin} className="text-emerald-800 dark:text-emerald-300">
                                Pin D{pin} (GPIO)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        <p>Available pins for relay control</p>
                      </div>
                    </div>

                    {/* Room Number Input */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-emerald-900 dark:text-emerald-400">
                          Room Details
                        </h3>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Info
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Room Number
                        </label>
                        <input
                          type="text"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          placeholder="Enter room number"
                          className="w-full px-3 py-1.5 border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 rounded-md text-emerald-900 dark:text-emerald-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        <p>Enter the room number/name</p>
                      </div>
                    </div>
                  </div>

                  {/* Make Connection Button */}
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={handleMakeConnection}
                      disabled={!selectedSensorPin || !selectedRoomPin || !roomNumber}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 text-white dark:text-gray-900 shadow-lg px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Link2 className="h-5 w-5 mr-3" />
                      Make Connection
                      <Zap className="h-5 w-5 ml-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Active Connections Card */}
              <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Active Connections
                  </CardTitle>
                  <CardDescription className="text-emerald-800 dark:text-emerald-300">
                    {connections.length} established connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-500">
                      No connections established yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {connections.map(connection => (
                        <div
                          key={connection.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          <div className="flex items-start gap-4 mb-3 sm:mb-0">
                            <div className={`h-3 w-3 rounded-full mt-1.5 ${connection.isBlocked ? "bg-red-500 animate-pulse" : connection.status === "connected"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-gray-400"
                              }`} />
                            <div className="w-full">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`font-medium ${connection.isBlocked ? "text-red-700 dark:text-red-400" : "text-emerald-900 dark:text-emerald-400"}`}>
                                  Sensor Pin: {connection.sensorPin}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500">→</span>
                                <span className={`font-medium ${connection.isBlocked ? "text-red-700 dark:text-red-400" : "text-emerald-900 dark:text-emerald-400"}`}>
                                  Room Pin: {connection.roomPin}
                                </span>
                                {connection.roomNumber && (
                                  <>
                                    <span className="hidden sm:inline text-gray-400 dark:text-gray-500">|</span>
                                    <span className={`font-medium ${connection.isBlocked ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                                      Room: {connection.roomNumber}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Last Active Time Section */}
                              <div className="mt-2 mb-3">
                                <div className="flex items-center text-sm">
                                  <span className="text-gray-600 dark:text-gray-400 mr-2">Last active:</span>
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

                              <div className="flex items-center gap-2 text-sm">
                                <span className={`px-2 py-1 rounded text-xs ${connection.isBlocked
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  : connection.status === "connected"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  }`}>
                                  {
                                    connection.isBlocked
                                      ? "Blocked"
                                      : connection.status === "connected"
                                        ? "Active"
                                        : "Inactive"
                                  }
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">•</span>
                                <span className="text-gray-600 dark:text-gray-400">ID: {connection.id}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {/* Toggle Block Switch */}
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={connection.isBlocked}
                                onCheckedChange={() =>
                                  handleToggleBlock({
                                    id: connection.id,
                                    blockStatus: !connection.isBlocked
                                  })
                                }
                                className={`data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-emerald-500 cursor-pointer`}
                              />
                            </div>

                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveConnection(connection.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Connection Status:</span>
                      <div className="flex items-center gap-2">
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
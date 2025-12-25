"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Wifi, Cpu, Link2, ChevronLeft, Save, Zap, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export function ESPConnectionPage({roomId}) {
  const router = useRouter();
  
  const [sensorESPStatus, setSensorESPStatus] = useState("active")
  const [roomESPStatus, setRoomESPStatus] = useState("inactive")
  const [selectedSensorPin, setSelectedSensorPin] = useState("")
  const [selectedRoomPin, setSelectedRoomPin] = useState("")
  const [connections, setConnections] = useState([
    { id: 1, sensorPin: "D1", roomPin: "D1", status: "connected" },
    { id: 2, sensorPin: "D2", roomPin: "D2", status: "connected" }
  ])

  const availablePins = [
    "D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"
  ]

  const handleMakeConnection = () => {
    if (selectedSensorPin && selectedRoomPin) {
      const exists = connections.some(
        conn => conn.sensorPin === selectedSensorPin && conn.roomPin === selectedRoomPin
      )
      
      if (!exists) {
        const newConnection = {
          id: connections.length + 1,
          sensorPin: selectedSensorPin,
          roomPin: selectedRoomPin,
          status: "pending"
        }
        
        setConnections([...connections, newConnection])
        
        setTimeout(() => {
          setConnections(prev => 
            prev.map(conn => 
              conn.id === newConnection.id 
                ? { ...conn, status: "connected" }
                : conn
            )
          )
        }, 1500)
        
        setSelectedSensorPin("")
        setSelectedRoomPin("")
      }
    }
  }

  const handleRemoveConnection = (id) => {
    setConnections(connections.filter(conn => conn.id !== id))
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
      {/* Header */}
      <div className="px-6 md:px-8 py-6 border-b border-emerald-200 dark:border-emerald-800 flex-shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-400 mb-1">
                ESP Connection Setup
              </h1>
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
                    ESP_RELAY_SENSOR_101
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
                    ESP_PIR_ROOM_101
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
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
                            {availablePins.map(pin => (
                              <SelectItem key={`sensor-${pin}`} value={pin} className="text-emerald-800 dark:text-emerald-300">
                                Pin {pin} (GPIO)
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
                            {availablePins.map(pin => (
                              <SelectItem key={`room-${pin}`} value={pin} className="text-emerald-800 dark:text-emerald-300">
                                Pin {pin} (GPIO)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        <p>Available pins for relay control</p>
                      </div>
                    </div>
                  </div>

                  {/* Make Connection Button */}
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={handleMakeConnection}
                      disabled={!selectedSensorPin || !selectedRoomPin}
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
                          className="flex items-center justify-between p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-3 w-3 rounded-full ${
                              connection.status === "connected" 
                                ? "bg-emerald-500 animate-pulse" 
                                : connection.status === "pending"
                                ? "bg-blue-500 animate-pulse"
                                : "bg-gray-400"
                            }`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-emerald-900 dark:text-emerald-400">
                                  Sensor ESP Pin: {connection.sensorPin}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium text-emerald-900 dark:text-emerald-400">
                                  Room ESP Pin: {connection.roomPin}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  connection.status === "connected" 
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                }`}>
                                  {connection.status === "connected" ? "Active" : "Connecting..."}
                                </span>
                                <span>•</span>
                                <span>ID: {connection.id}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveConnection(connection.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Remove
                          </Button>
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
                          <span className="text-emerald-900 dark:text-emerald-400">Connected</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span className="text-blue-900 dark:text-blue-400">Pending</span>
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
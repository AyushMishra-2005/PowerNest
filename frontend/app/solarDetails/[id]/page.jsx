"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import server from "../../../envirnoment.js"
import {
  ArrowLeft,
  Activity,
  Sun,
  Zap,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  Gauge,
  Cpu,
  Wifi,
  WifiOff,
  Clock,
  Home,
  Lightbulb,
  ShieldCheck,
  CircleAlert,
  CircleCheck,
  RefreshCw,
} from "lucide-react"

import { useSocketContext } from "@/context/SocketContext.jsx"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

const initialData = {
  espId: "esp32-01",
  timestamp: 0,
  sunlight: 0,
  solarVoltage: 0,
  solarCurrent: 0,
  solarPower: 0,
  requestedLoad: 0,
  essentialLoad: 0,
  nonEssentialLoad: 0,
  actualLoad: 0,
  netPower: 0,
  excessSolarPower: 0,
  powerDeficit: 0,
  powerCondition: "WAITING",
  supplyMode: "WAITING",
  battery: 0,
  batteryEnergy: 0,
  batteryVoltage: 0,
  batteryPower: 0,
  batteryState: "WAITING",
  batteryUsed: false,
  batteryCharging: false,
  batteryIdle: false,
  batteryCritical: false,
  batteryFull: false,
  essentialActive: false,
  nonEssentialActive: false,
  energySaveActive: false,
  status: "WAITING",
  event: "WAITING",
}

export default function SolarDetailsPage() {
  const router = useRouter()
  const params = useParams()

  const { socket } = useSocketContext()

  const espId = decodeURIComponent(params?.id || "esp32-01")

  const [data, setData] = useState({
    ...initialData,
    espId,
  })
  const formatHistoryTime = (timestamp) => {
    const value = Number(timestamp)

    if (!Number.isFinite(value) || value <= 0) {
      return new Date().toLocaleTimeString([], {
        minute: "2-digit",
        second: "2-digit",
      })
    }

    return new Date(value).toLocaleTimeString([], {
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatTelemetry = (telemetry) => {
    const timestamp = telemetry.createdAt
      ? new Date(telemetry.createdAt).getTime()
      : Date.now()

    return {
      ...telemetry,
      espId,
      historyTimestamp: timestamp,
      time: formatHistoryTime(timestamp),
      solarPower: Number(telemetry.solarPower || 0),
      requestedLoad: Number(telemetry.requestedLoad || 0),
      essentialLoad: Number(telemetry.essentialLoad || 0),
      nonEssentialLoad: Number(telemetry.nonEssentialLoad || 0),
      actualLoad: Number(telemetry.actualLoad || 0),
      netPower: Number(telemetry.netPower || 0),
      excessSolarPower: Number(telemetry.excessSolarPower || 0),
      powerDeficit: Number(telemetry.powerDeficit || 0),
      battery: Number(telemetry.battery || 0),
      batteryEnergy: Number(telemetry.batteryEnergy || 0),
      batteryVoltage: Number(telemetry.batteryVoltage || 0),
      batteryPower: Number(telemetry.batteryPower || 0),
      sunlight: Number(telemetry.sunlight || 0),
      solarVoltage: Number(telemetry.solarVoltage || 0),
      solarCurrent: Number(telemetry.solarCurrent || 0),
    }
  }

  const [history, setHistory] = useState([])
  const [connectionStatus, setConnectionStatus] =
    useState("connecting")
  const [lastUpdate, setLastUpdate] = useState(null)
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    setData({
      ...initialData,
      espId,
    })
    setHistory([])
    setLastUpdate(null)
  }, [espId])

  useEffect(() => {
    if (!socket) {
      setConnectionStatus("disconnected")
      return
    }

    const handleConnect = () => {
      setConnectionStatus("connected")
    }

    const handleDisconnect = () => {
      setConnectionStatus("disconnected")
    }

    const handleTelemetry = (incoming) => {
      try {
        const telemetry = incoming?.data || incoming

        if (!telemetry || typeof telemetry !== "object") {
          return
        }

        if (
          telemetry.espId &&
          telemetry.espId !== espId
        ) {
          return
        }

        const formatted = formatTelemetry(telemetry)

        const updatedData = {
          ...initialData,
          ...formatted,
          espId,
        }

        setData(updatedData)
        setLastUpdate(formatted.historyTimestamp)

        setHistory((previous) => {
          const combined = [...previous, formatted]
          const now = Date.now()

          const unique = Array.from(
            new Map(
              combined.map((item) => [
                item._id ||
                  `${item.historyTimestamp}-${item.espId}`,
                item,
              ])
            ).values()
          )

          return unique
            .filter(
              (item) =>
                now - item.historyTimestamp <= 10000
            )
            .sort(
              (a, b) =>
                a.historyTimestamp - b.historyTimestamp
            )
        })
      } catch (error) {
        console.error(
          "Invalid solar telemetry:",
          error
        )
      }
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("solar_telemetry", handleTelemetry)

    if (socket.connected) {
      setConnectionStatus("connected")
    }

    const fetchRecentTelemetry = async () => {
      try {
        const response = await axios.get(
          `${server}/solar-esp/telemetry/${encodeURIComponent(espId)}`,
          {
            withCredentials: true,
          }
        )

        const recentData = response.data?.data || []

        const formattedHistory = recentData
          .map((item) => formatTelemetry(item))
          .filter(
            (item) =>
              Date.now() - item.historyTimestamp <= 10000
          )
          .sort(
            (a, b) =>
              a.historyTimestamp - b.historyTimestamp
          )

        setHistory((previous) => {
          const combined = [...formattedHistory, ...previous]
          const now = Date.now()

          const unique = Array.from(
            new Map(
              combined.map((item) => [
                item._id ||
                  `${item.historyTimestamp}-${item.espId}`,
                item,
              ])
            ).values()
          )

          return unique
            .filter(
              (item) =>
                now - item.historyTimestamp <= 10000
            )
            .sort(
              (a, b) =>
                a.historyTimestamp - b.historyTimestamp
            )
        })

        if (formattedHistory.length > 0) {
          const latest =
            formattedHistory[formattedHistory.length - 1]

          setData({
            ...initialData,
            ...latest,
            espId,
          })

          setLastUpdate(latest.historyTimestamp)
        }
      } catch (error) {
        console.error(
          "Failed to fetch recent solar telemetry:",
          error
        )
      }
    }

    fetchRecentTelemetry()

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("solar_telemetry", handleTelemetry)
    }
  }, [socket, espId])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()

      setHistory((previous) =>
        previous.filter(
          (item) =>
            now - item.historyTimestamp <= 10000
        )
      )

      if (!lastUpdate) {
        setSecondsAgo(0)
        return
      }

      setSecondsAgo(
        Math.max(
          0,
          Math.floor((now - lastUpdate) / 1000)
        )
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [lastUpdate])

  const power = (value) =>
    `${Number(value || 0).toFixed(2)} W`

  const voltage = (value) =>
    `${Number(value || 0).toFixed(2)} V`

  const current = (value) =>
    `${Number(value || 0).toFixed(2)} A`

  const energy = (value) =>
    `${Number(value || 0).toFixed(2)} Wh`

  const percentage = (value) =>
    `${Number(value || 0).toFixed(1)}%`

  const batteryPercent = Math.min(
    100,
    Math.max(0, Number(data.battery || 0))
  )

  

  const statusClass =
    data.status === "CHARGING"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      : data.status === "DISCHARGING"
      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"

  const powerConditionClass =
    data.powerCondition === "SOLAR > LOAD"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      : data.powerCondition === "SOLAR < LOAD"
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"

  return (
    <div className="min-h-screen bg-white dark:bg-black">


      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-black backdrop-blur-sm mt-12 md:mt-0 lg:mt-0">

        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">

              <button
                onClick={() =>
                  router.push("/solarManagement")
                }
                className="self-start sm:self-center text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-2 rounded-md flex items-center text-sm font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>

              <div className="flex-1 min-w-0">

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">

                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-400 truncate">
                    Solar Energy Monitoring
                  </h1>

                  <span className="text-lg sm:text-xl font-semibold text-emerald-700 dark:text-emerald-300">
                    • {espId}
                  </span>

                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  Real-time renewable energy and battery monitoring
                </p>

              </div>

            </div>


            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                connectionStatus === "connected"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : connectionStatus === "connecting"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >

              {connectionStatus === "connected" ? (
                <Wifi className="h-4 w-4" />
              ) : connectionStatus === "connecting" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}

              {connectionStatus === "connected"
                ? "Live"
                : connectionStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"}

            </div>

          </div>
        </div>
      </div>


      <div className="overflow-y-auto">

        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:px-8">

    
          <div className="flex items-center justify-end mb-4 text-xs sm:text-sm text-gray-500 dark:text-gray-500">

            <Clock className="h-4 w-4 mr-2" />

            {lastUpdate
              ? `Last updated ${secondsAgo}s ago`
              : "Waiting for telemetry"}

          </div>

    
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 bg-white dark:bg-black hover:shadow-lg transition-all duration-300">

              <div className="flex items-center justify-between">

                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Sun className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>

              </div>

              <p className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Solar Power
              </p>

              <p className="mt-1 text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-400">
                {power(data.solarPower)}
              </p>

            </div>


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 bg-white dark:bg-black hover:shadow-lg transition-all duration-300">

              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <p className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Current Load
              </p>

              <p className="mt-1 text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-400">
                {power(data.actualLoad)}
              </p>

            </div>


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 bg-white dark:bg-black hover:shadow-lg transition-all duration-300">

              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <p className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Net Power
              </p>

              <p
                className={`mt-1 text-lg sm:text-xl font-bold ${
                  data.netPower >= 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {data.netPower >= 0 ? "+" : ""}
                {power(data.netPower)}
              </p>

            </div>


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 bg-white dark:bg-black hover:shadow-lg transition-all duration-300">

              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <BatteryCharging className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <p className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Battery
              </p>

              <p className="mt-1 text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-400">
                {percentage(data.battery)}
              </p>

            </div>


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 bg-white dark:bg-black hover:shadow-lg transition-all duration-300">

              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Sun className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <p className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Sunlight
              </p>

              <p className="mt-1 text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-400">
                {percentage(data.sunlight)}
              </p>

            </div>


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 bg-white dark:bg-black hover:shadow-lg transition-all duration-300">

              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Battery className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <p className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Battery State
              </p>

              <p className="mt-1 text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-400">
                {data.batteryState}
              </p>

            </div>

          </div>

    
          <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg hover:shadow-lg transition-all duration-300 bg-white dark:bg-black mb-4 sm:mb-6">

            <div className="p-4 sm:p-6 border-b border-emerald-200 dark:border-emerald-800">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                <div>

                  <h2 className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-400">
                    Power Flow
                  </h2>

                  <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                    Real-time energy distribution
                  </p>

                </div>

                <div className="flex flex-wrap gap-2">

                  <span
                    className={`px-2.5 py-1 rounded text-xs font-medium ${powerConditionClass}`}
                  >
                    {data.powerCondition}
                  </span>

                  <span className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {data.supplyMode}
                  </span>

                </div>

              </div>

            </div>

            <div className="p-4 sm:p-6">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    
                <div className="p-5 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-center">

                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Sun className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Solar Generation
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-400">
                    {power(data.solarPower)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {voltage(data.solarVoltage)} •{" "}
                    {current(data.solarCurrent)}
                  </p>

                </div>

    
                <div className="p-5 rounded-lg bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-center">

                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Home className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Actual Load
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-400">
                    {power(data.actualLoad)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Requested: {power(data.requestedLoad)}
                  </p>

                </div>

    
                <div className="p-5 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-center">

                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Battery className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Battery
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-400">
                    {percentage(data.battery)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {power(Math.abs(data.batteryPower))}
                  </p>

                </div>

              </div>

  
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">

                <div className="p-3 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Excess Solar
                  </p>
                  <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    {power(data.excessSolarPower)}
                  </p>
                </div>

                <div className="p-3 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Power Deficit
                  </p>
                  <p className="mt-1 font-semibold text-red-600 dark:text-red-400">
                    {power(data.powerDeficit)}
                  </p>
                </div>

                <div className="p-3 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Voltage
                  </p>
                  <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    {voltage(data.solarVoltage)}
                  </p>
                </div>

                <div className="p-3 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Current
                  </p>
                  <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    {current(data.solarCurrent)}
                  </p>
                </div>

              </div>

            </div>
          </div>

    
          <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg hover:shadow-lg transition-all duration-300 bg-white dark:bg-black mb-4 sm:mb-6">

            <div className="p-4 sm:p-6 border-b border-emerald-200 dark:border-emerald-800">

              <h2 className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-400">
                Power Overview
              </h2>

              <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                Real-time generation and consumption
              </p>

            </div>

            <div className="p-4 sm:p-6">

              <div className="h-[280px] sm:h-[340px] w-full">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart data={history}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      opacity={0.1}
                    />

                    <XAxis
                      dataKey="time"
                      fontSize={11}
                      stroke="currentColor"
                      opacity={0.6}
                    />

                    <YAxis
                      fontSize={11}
                      stroke="currentColor"
                      opacity={0.6}
                      unit=" W"
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor:
                          "var(--background)",
                        border:
                          "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="solarPower"
                      name="Solar Power"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />

                    

                    <Line
                      type="monotone"
                      dataKey="actualLoad"
                      name="Actual Load"
                      stroke="var(--chart-3)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="netPower"
                      name="Net Power"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />

                  </LineChart>
                </ResponsiveContainer>

              </div>

            </div>
          </div>

    
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg hover:shadow-lg transition-all duration-300 bg-white dark:bg-black">

              <div className="p-4 sm:p-6 border-b border-emerald-200 dark:border-emerald-800">

                <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-400">
                  Battery History
                </h2>

                <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                  Battery level and stored energy over time
                </p>

              </div>

              <div className="p-4 sm:p-6">

                <div className="h-[270px]">

                  <ResponsiveContainer width="100%" height="100%">

                    <LineChart data={history}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        opacity={0.1}
                      />

                      <XAxis
                        dataKey="time"
                        fontSize={11}
                        stroke="currentColor"
                        opacity={0.6}
                      />

                      <YAxis
                        yAxisId="battery"
                        fontSize={11}
                        stroke="currentColor"
                        opacity={0.6}
                        unit="%"
                        domain={[0, 100]}
                      />

                      <YAxis
                        yAxisId="energy"
                        orientation="right"
                        fontSize={11}
                        stroke="currentColor"
                        opacity={0.6}
                        unit=" Wh"
                        domain={[0, "auto"]}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />

                      <Legend />

                      <Line
                        yAxisId="battery"
                        type="monotone"
                        dataKey="battery"
                        name="Battery %"
                        stroke="var(--chart-2)"
                        strokeWidth={2.5}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />

                      <Line
                        yAxisId="energy"
                        type="monotone"
                        dataKey="batteryEnergy"
                        name="Stored Energy Wh"
                        stroke="var(--chart-5)"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              </div>

            </div>


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg hover:shadow-lg transition-all duration-300 bg-white dark:bg-black">

              <div className="p-4 sm:p-6 border-b border-emerald-200 dark:border-emerald-800">

                <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-400">
                  Load History
                </h2>

                <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                  Requested and actual power consumption
                </p>

              </div>

              <div className="p-4 sm:p-6">

                <div className="h-[270px]">

                  <ResponsiveContainer width="100%" height="100%">

                    <LineChart data={history}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        opacity={0.1}
                      />

                      <XAxis
                        dataKey="time"
                        fontSize={11}
                        stroke="currentColor"
                        opacity={0.6}
                      />

                      <YAxis
                        fontSize={11}
                        stroke="currentColor"
                        opacity={0.6}
                        unit=" W"
                        domain={[0, "auto"]}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />

                      <Legend />

                      

                      <Line
                        type="monotone"
                        dataKey="actualLoad"
                        name="Actual Load"
                        stroke="var(--chart-3)"
                        strokeWidth={2.5}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />

                      <Line
                        type="monotone"
                        dataKey="essentialLoad"
                        name="Essential Load"
                        stroke="var(--chart-4)"
                        strokeWidth={1.8}
                        dot={false}
                        isAnimationActive={false}
                      />

                      <Line
                        type="monotone"
                        dataKey="nonEssentialLoad"
                        name="Non-Essential Load"
                        stroke="var(--chart-5)"
                        strokeWidth={1.8}
                        dot={false}
                        isAnimationActive={false}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              </div>

            </div>


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg hover:shadow-lg transition-all duration-300 bg-white dark:bg-black">

              <div className="p-4 sm:p-6 border-b border-emerald-200 dark:border-emerald-800">

                <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-400">
                  Solar Generation History
                </h2>

                <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                  Solar power generated and excess energy
                </p>

              </div>

              <div className="p-4 sm:p-6">

                <div className="h-[270px]">

                  <ResponsiveContainer width="100%" height="100%">

                    <AreaChart data={history}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        opacity={0.1}
                      />

                      <XAxis
                        dataKey="time"
                        fontSize={11}
                        stroke="currentColor"
                        opacity={0.6}
                      />

                      <YAxis
                        fontSize={11}
                        stroke="currentColor"
                        opacity={0.6}
                        unit=" W"
                        domain={[0, "auto"]}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />

                      <Legend />

                      <Area
                        type="monotone"
                        dataKey="solarPower"
                        name="Solar Power"
                        stroke="var(--chart-2)"
                        fill="var(--chart-2)"
                        fillOpacity={0.15}
                        strokeWidth={2.5}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />

                      <Area
                        type="monotone"
                        dataKey="excessSolarPower"
                        name="Excess Solar"
                        stroke="var(--chart-5)"
                        fill="var(--chart-5)"
                        fillOpacity={0.08}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />

                    </AreaChart>

                  </ResponsiveContainer>

                </div>

              </div>

            </div>


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg hover:shadow-lg transition-all duration-300 bg-white dark:bg-black">

              <div className="p-4 sm:p-6 border-b border-emerald-200 dark:border-emerald-800">

                <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-400">
                  Solar Conditions History
                </h2>

                <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                  Sunlight, voltage and current over time
                </p>

              </div>

              <div className="p-4 sm:p-6">

                <div className="h-[270px]">

                  <ResponsiveContainer width="100%" height="100%">

                    <LineChart data={history}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        opacity={0.1}
                      />

                      <XAxis
                        dataKey="time"
                        fontSize={11}
                        stroke="currentColor"
                        opacity={0.6}
                      />

                      <YAxis
                        yAxisId="sunlight"
                        fontSize={11}
                        stroke="currentColor"
                        opacity={0.6}
                        unit="%"
                        domain={[0, 100]}
                      />

                      <YAxis
                        yAxisId="electrical"
                        orientation="right"
                        fontSize={11}
                        stroke="currentColor"
                        opacity={0.6}
                        domain={[0, "auto"]}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />

                      <Legend />

                      <Line
                        yAxisId="sunlight"
                        type="monotone"
                        dataKey="sunlight"
                        name="Sunlight %"
                        stroke="var(--chart-2)"
                        strokeWidth={2.5}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />

                      <Line
                        yAxisId="electrical"
                        type="monotone"
                        dataKey="solarVoltage"
                        name="Voltage V"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />

                      <Line
                        yAxisId="electrical"
                        type="monotone"
                        dataKey="solarCurrent"
                        name="Current A"
                        stroke="var(--chart-3)"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              </div>

            </div>

          </div>

    
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg hover:shadow-lg transition-all duration-300 bg-white dark:bg-black">

              <div className="p-4 sm:p-6 border-b border-emerald-200 dark:border-emerald-800">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-400">
                      Battery Status
                    </h2>

                    <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                      Current battery condition
                    </p>
                  </div>

                  <BatteryCharging className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />

                </div>

              </div>

              <div className="p-4 sm:p-6">

    
                <div className="flex items-center gap-5">

                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0">

                    <svg
                      className="h-full w-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-emerald-100 dark:text-emerald-900/30"
                      />

                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${batteryPercent * 2.64} 264`}
                        className="text-emerald-500"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">

                      <span className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-400">
                        {percentage(data.battery)}
                      </span>

                    </div>

                  </div>

                  <div>

                    <span
                      className={`px-3 py-1.5 rounded text-xs font-medium ${statusClass}`}
                    >
                      {data.batteryState}
                    </span>

                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-500">
                      Battery condition
                    </p>

                  </div>

                </div>

    
                <div className="grid grid-cols-2 gap-3 mt-6">

                  <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-xs text-gray-500">
                      Energy
                    </p>
                    <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      {energy(data.batteryEnergy)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-xs text-gray-500">
                      Voltage
                    </p>
                    <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      {voltage(data.batteryVoltage)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-xs text-gray-500">
                      Battery Power
                    </p>
                    <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      {power(Math.abs(data.batteryPower))}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-xs text-gray-500">
                      Battery Used
                    </p>
                    <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      {data.batteryUsed ? "YES" : "NO"}
                    </p>
                  </div>

                </div>

                {data.batteryCritical && (
                  <div className="mt-4 flex gap-3 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">

                    <CircleAlert className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />

                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        Critical Battery
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Battery is at or below the critical threshold.
                      </p>
                    </div>

                  </div>
                )}

              </div>
            </div>


            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg hover:shadow-lg transition-all duration-300 bg-white dark:bg-black">

              <div className="p-4 sm:p-6 border-b border-emerald-200 dark:border-emerald-800">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-400">
                      Load Management
                    </h2>

                    <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                      Current power consumption
                    </p>
                  </div>

                  <Lightbulb className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />

                </div>

              </div>

              <div className="p-4 sm:p-6">

                <div className="space-y-3">

                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/30 dark:bg-emerald-900/10">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Requested Load
                    </span>

                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {power(data.requestedLoad)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/30 dark:bg-emerald-900/10">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Essential Load
                    </span>

                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {power(data.essentialLoad)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/30 dark:bg-emerald-900/10">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Non-Essential Load
                    </span>

                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {power(data.nonEssentialLoad)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-300 dark:border-emerald-700">
                    <span className="text-sm font-medium text-emerald-900 dark:text-emerald-400">
                      Actual Load
                    </span>

                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {power(data.actualLoad)}
                    </span>
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">

                  <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">

                    <div className="flex items-center justify-between gap-2">

                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Essential
                      </span>

                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          data.essentialActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                        }`}
                      >
                        {data.essentialActive
                          ? "ON"
                          : "OFF"}
                      </span>

                    </div>

                  </div>

                  <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">

                    <div className="flex items-center justify-between gap-2">

                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Non-Essential
                      </span>

                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          data.nonEssentialActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                        }`}
                      >
                        {data.nonEssentialActive
                          ? "ON"
                          : "OFF"}
                      </span>

                    </div>

                  </div>

                </div>

                <div
                  className={`mt-4 flex items-center gap-3 p-3 rounded-lg ${
                    data.energySaveActive
                      ? "bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800"
                      : "bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"
                  }`}
                >

                  {data.energySaveActive ? (
                    <CircleAlert className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  )}

                  <div>

                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Energy Saving{" "}
                      {data.energySaveActive
                        ? "Active"
                        : "Inactive"}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {data.energySaveActive
                        ? "Non-essential loads are being managed."
                        : "Normal load management is active."}
                    </p>

                  </div>

                </div>

              </div>
            </div>

          </div>

    
          <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg hover:shadow-lg transition-all duration-300 bg-white dark:bg-black mb-4 sm:mb-6">

            <div className="p-4 sm:p-6 border-b border-emerald-200 dark:border-emerald-800">

              <div className="flex items-center gap-2">

                <Cpu className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />

                <div>

                  <h2 className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-400">
                    System Status
                  </h2>

                  <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                    Current PowerNest controller state
                  </p>

                </div>

              </div>

            </div>

            <div className="p-4 sm:p-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">

                {[
                  ["Power Condition", data.powerCondition],
                  ["Supply Mode", data.supplyMode],
                  ["Battery State", data.batteryState],
                  [
                    "Battery Used",
                    data.batteryUsed ? "YES" : "NO",
                  ],
                  [
                    "Battery Charging",
                    data.batteryCharging ? "YES" : "NO",
                  ],
                  [
                    "Battery Idle",
                    data.batteryIdle ? "YES" : "NO",
                  ],
                  [
                    "Battery Critical",
                    data.batteryCritical ? "YES" : "NO",
                  ],
                  [
                    "Battery Full",
                    data.batteryFull ? "YES" : "NO",
                  ],
                  [
                    "Energy Saving",
                    data.energySaveActive
                      ? "ACTIVE"
                      : "INACTIVE",
                  ],
                  ["ESP ID", data.espId],
                ].map(([label, value]) => (

                  <div
                    key={label}
                    className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-900/5"
                  >

                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {label}
                    </p>

                    <div className="flex items-center gap-2 mt-2">

                      {value === "YES" ||
                      value === "ACTIVE" ||
                      value === "CHARGING" ? (
                        <CircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : null}

                      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300 break-words">
                        {value}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

  
              <div className="mt-5 pt-4 border-t border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">

                <div className="flex items-center gap-2 text-xs sm:text-sm">

                  <div
                    className={`h-2 w-2 rounded-full ${
                      connectionStatus === "connected"
                        ? "bg-emerald-500 animate-pulse"
                        : connectionStatus === "connecting"
                        ? "bg-blue-500"
                        : "bg-red-500"
                    }`}
                  />

                  <span className="text-gray-600 dark:text-gray-400">
                    {connectionStatus === "connected"
                      ? "Real-time updates via WebSocket"
                      : "WebSocket disconnected"}
                  </span>

                </div>

                <span className="text-xs text-gray-500">
                  Event: {data.event}
                </span>

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

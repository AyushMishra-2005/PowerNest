"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sun,
  Plus,
  Eye,
  Trash2,
  MapPin,
  Cpu,
  Battery,
  Zap,
  Activity,
  X,
  Save,
} from "lucide-react"

const STORAGE_KEY = "powernest_solar_systems"

const defaultSolar = {
  id: "esp32-01",
  name: "Central Block Solar",
  location: "Central Block",
  description:
    "Solar energy monitoring and battery management system for the Central Block.",
}

export default function SolarManagementPage() {
  const router = useRouter()

  const [solars, setSolars] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    espId: "",
    location: "",
    description: "",
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)

      if (stored) {
        setSolars(JSON.parse(stored))
      } else {
        setSolars([defaultSolar])
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify([defaultSolar])
        )
      }
    } catch (error) {
      console.error("Failed to load solar systems:", error)
      setSolars([defaultSolar])
    }
  }, [])

  useEffect(() => {
    if (solars.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(solars))
    }
  }, [solars])

  const handleAddSolar = (e) => {
    e.preventDefault()

    if (
      !formData.name.trim() ||
      !formData.espId.trim() ||
      !formData.location.trim()
    ) {
      return
    }

    const exists = solars.some(
      (solar) =>
        solar.id.toLowerCase() === formData.espId.trim().toLowerCase()
    )

    if (exists) {
      alert("A solar system with this ESP ID already exists.")
      return
    }

    const newSolar = {
      id: formData.espId.trim(),
      name: formData.name.trim(),
      location: formData.location.trim(),
      description:
        formData.description.trim() ||
        "Solar energy monitoring system for PowerNest.",
    }

    setSolars((prev) => [...prev, newSolar])

    setFormData({
      name: "",
      espId: "",
      location: "",
      description: "",
    })

    setShowAddForm(false)
  }

  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this solar system?"
    )

    if (!confirmDelete) return

    setSolars((prev) => {
      const updated = prev.filter((solar) => solar.id !== id)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      return updated
    })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* HEADER */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-black backdrop-blur-sm mt-12 md:mt-0 lg:mt-0">
        <div className="">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-400">
                Solar Management
              </h1>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage and monitor solar energy systems across your campus
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-900 font-medium h-10 sm:h-12 px-5 sm:px-6 rounded-lg flex items-center justify-center hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 shadow-lg transition-all duration-300 cursor-pointer"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Add New Solar
            </button>

          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="overflow-y-auto">
        <div className="p-4 sm:p-6 lg:px-8">

          {/* SECTION HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-400">
                Solar Systems
              </h2>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Monitor connected renewable energy systems
              </p>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                {solars.length}
              </span>{" "}
              {solars.length === 1 ? "solar system" : "solar systems"}
            </div>
          </div>

          {/* SOLAR CARDS */}
          {solars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

              {solars.map((solar) => (
                <div
                  key={solar.id}
                  className="border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-black rounded-lg hover:shadow-lg transition-all duration-300 p-5 sm:p-6 flex flex-col"
                >
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Sun className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg text-emerald-900 dark:text-emerald-400 truncate">
                          {solar.name}
                        </h3>

                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          Solar Energy System
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Active
                    </span>

                  </div>

                  {/* ESP ID */}
                  <div className="mt-5 space-y-3">

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Cpu className="h-4 w-4" />
                        ESP ID
                      </div>

                      <span className="font-medium font-mono text-emerald-700 dark:text-emerald-400">
                        {solar.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>

                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {solar.location}
                      </span>
                    </div>

                  </div>

                  {/* DESCRIPTION */}
                  <p className="mt-5 text-sm sm:text-base leading-6 text-gray-600 dark:text-gray-400">
                    {solar.description}
                  </p>

                  {/* LIVE METRICS */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6">

                    <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-500">
                        <Zap className="h-3.5 w-3.5" />
                        <span className="text-xs">Power</span>
                      </div>

                      <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                        8.04 W
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-500">
                        <Battery className="h-3.5 w-3.5" />
                        <span className="text-xs">Battery</span>
                      </div>

                      <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                        0.1%
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-500">
                        <Activity className="h-3.5 w-3.5" />
                        <span className="text-xs">State</span>
                      </div>

                      <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                        Charging
                      </p>
                    </div>

                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-2 mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-800">

                    <button
                      onClick={() =>
                        router.push(
                          `/solarDetails/${encodeURIComponent(solar.id)}`
                        )
                      }
                      className="flex-1 px-3 py-2.5 rounded-md border border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>

                    <button
                      onClick={() => handleDelete(solar.id)}
                      className="px-3 py-2.5 rounded-md border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 cursor-pointer"
                      title="Remove Solar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>
                </div>
              ))}

            </div>
          ) : (
            /* EMPTY STATE */
            <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg py-12 sm:py-16 text-center">

              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <Sun className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600 dark:text-emerald-400" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No solar systems yet
              </h3>

              <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto text-sm sm:text-base px-4">
                Add your first solar system to start monitoring renewable
                energy generation and battery performance.
              </p>

              <button
                onClick={() => setShowAddForm(true)}
                className="mt-5 bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-900 px-5 py-2.5 rounded-lg font-medium shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Add New Solar
              </button>

            </div>
          )}

        </div>
      </div>

      {/* ADD SOLAR MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-lg bg-white dark:bg-gray-950 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-emerald-200 dark:border-emerald-800">

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-400">
                  Add New Solar
                </h2>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Register a solar ESP with PowerNest
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleAddSolar}
              className="p-5 sm:p-6 space-y-4"
            >

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Solar Name
                </label>

                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Central Block Solar"
                  className="w-full px-3 py-2.5 text-sm border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 rounded-md text-emerald-900 dark:text-emerald-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  ESP ID
                </label>

                <input
                  value={formData.espId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      espId: e.target.value,
                    })
                  }
                  placeholder="esp32-01"
                  className="w-full px-3 py-2.5 text-sm border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 rounded-md font-mono text-emerald-900 dark:text-emerald-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Building / Location
                </label>

                <input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: e.target.value,
                    })
                  }
                  placeholder="Central Block"
                  className="w-full px-3 py-2.5 text-sm border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 rounded-md text-emerald-900 dark:text-emerald-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Description
                  <span className="font-normal text-gray-500 ml-1">
                    (Optional)
                  </span>
                </label>

                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Describe this solar system..."
                  className="w-full px-3 py-2.5 text-sm border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 rounded-md text-emerald-900 dark:text-emerald-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-900 font-medium shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300"
                >
                  <Save className="h-4 w-4 inline mr-2" />
                  Add Solar
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
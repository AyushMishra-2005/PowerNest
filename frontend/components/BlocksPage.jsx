"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, Plus, ChevronRight, Eye, ChevronDown, ChevronUp } from "lucide-react"
import {AnimatedModal} from '@/components/AnimatedModal'
import { useRouter } from "next/navigation"

export function BlocksPage() {
  const [showAllBlocks, setShowAllBlocks] = useState(false)
  const contentRef = useRef(null)
  const router = useRouter();
  
  // All blocks in one array
  const allBlocks = [
    {
      id: 1,
      name: "Central Block",
      type: "Academic",
      rooms: 24,
      devices: 18,
      energyUsage: "142 kWh",
      status: "active",
      description: "Main academic building with smart classrooms and labs"
    },
    {
      id: 2,
      name: "Auditorium Block",
      type: "Events",
      rooms: 8,
      devices: 12,
      energyUsage: "98 kWh",
      status: "active",
      description: "Large event space with advanced AV systems"
    },
    {
      id: 3,
      name: "Library Block",
      type: "Academic",
      rooms: 16,
      devices: 10,
      energyUsage: "87 kWh",
      status: "active",
      description: "Digital library with study zones and research labs"
    },
    {
      id: 4,
      name: "Science Block",
      type: "Laboratory",
      rooms: 18,
      devices: 22,
      energyUsage: "156 kWh",
      status: "active",
      description: "Advanced science laboratories and research facilities"
    },
    {
      id: 5,
      name: "Administration Block",
      type: "Office",
      rooms: 12,
      devices: 8,
      energyUsage: "76 kWh",
      status: "maintenance",
      description: "Main administrative offices and meeting rooms"
    }
  ]
  
  const displayedBlocks = showAllBlocks ? allBlocks : allBlocks.slice(0, 4)

  const showExploreMore = allBlocks.length > 3

  const handleViewDetails = (blockId) => {
    console.log(`Viewing details for block ${blockId}`)
    router.push("/espConnetion");
  }

  const handleExploreMore = () => {
    setShowAllBlocks(true)
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleCollapse = () => {
    setShowAllBlocks(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getGridCols = () => {
    if (!showAllBlocks) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4"
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  }

  return (
    <div className="h-[100vh] bg-white dark:bg-black overflow-hidden flex flex-col">
      
      <div className="px-6 md:px-8 py-6 border-b border-emerald-200 dark:border-emerald-800 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-400 mb-2">
              Building Blocks Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage and monitor all building blocks in your campus
            </p>
          </div>
          
          <AnimatedModal/>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 md:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-400">
                {showAllBlocks ? "All Building Blocks" : "Featured Blocks"}
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {displayedBlocks.length} of {allBlocks.length} blocks
              </div>
            </div>

            <div className={`grid ${getGridCols()} gap-6 mb-8`}>
              {displayedBlocks.map((block) => (
                <Card 
                  key={block.id} 
                  className="border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all hover:shadow-lg group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-emerald-900 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                          {block.name}
                        </CardTitle>
                        <CardDescription className="text-emerald-800 dark:text-emerald-300">
                          {block.type} Block
                        </CardDescription>
                      </div>
                      <Badge className={
                        block.status === "active" 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      }>
                        {block.status === "active" ? "Active" : "Maintenance"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {block.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                          <Building className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Rooms</p>
                          <p className="font-medium text-emerald-900 dark:text-emerald-400">{block.rooms}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group-hover:border-emerald-500 dark:group-hover:border-emerald-300 transition-all"
                      onClick={() => handleViewDetails(block.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          {showExploreMore && (
            <div ref={contentRef} className="transition-all duration-500">
              {!showAllBlocks ? (
                <div className="text-center py-8">
                  <Button
                    onClick={handleExploreMore}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 text-white dark:text-gray-900 shadow-lg hover:shadow-xl px-8 py-6 text-lg"
                  >
                    <ChevronDown className="h-5 w-5 mr-2" />
                    Explore More Blocks
                    <span className="ml-3 text-sm bg-white/30 dark:bg-black/30 text-white dark:text-gray-900 px-3 py-1 rounded-full">
                      +{allBlocks.length - 4}
                    </span>
                  </Button>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                    Click to expand and view all {allBlocks.length} building blocks
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 border-t border-emerald-200 dark:border-emerald-800 mt-8">
                  <Button
                    variant="outline"
                    onClick={handleCollapse}
                    className="border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-8 py-6 text-lg"
                  >
                    <ChevronUp className="h-5 w-5 mr-2" />
                    Collapse View
                    <span className="ml-3 text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full">
                      Show only 4
                    </span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
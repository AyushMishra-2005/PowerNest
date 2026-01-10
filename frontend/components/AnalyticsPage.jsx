"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Zap, Activity, Download, Home, BarChart3, TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { redirect, useRouter } from 'next/navigation';
import useEspDataStore from '../store/espDataStore';
import useBlockData from '../store/blockData';
import axios from 'axios'
import server from '../envirnoment.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function AnalyticsPage({ connectionId }) {
  const router = useRouter();
  const { allEspData } = useEspDataStore();
  const [loading, setLoading] = useState(true);
  const [connectionData, setConnectionData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState(10);
  const { blockData } = useBlockData();

  useEffect(() => {
    if (!blockData || !connectionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const getRoomUsage = async () => {
      try {
        const blockId = blockData._id;

        const { data } = await axios.post(
          `${server}/esp/get-room-data`,
          {blockId, connectionId},
          {withCredentials: true}
        );

        setConnectionData(data.data);
        prepareChartData(data.data.usageStats);

      } catch (err) {
        console.log(err);
      }finally{
        setLoading(false);
      }
    }
    getRoomUsage();
  }, [blockData, connectionId]);

  const prepareChartData = (usageStats, customTimeRange = timeRange) => {
    const daysToShow = customTimeRange || timeRange;

    if (!usageStats || usageStats.length === 0) {
      const today = new Date();
      const daysAgo = subDays(today, daysToShow - 1);

      const dateRange = eachDayOfInterval({
        start: daysAgo,
        end: today
      });

      const labels = dateRange.map(date => format(date, 'MMM dd'));
      const dataPoints = new Array(daysToShow).fill(0);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Active Duration (hours)',
            data: dataPoints,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      });
      return;
    }

    const today = new Date();
    const startDate = subDays(today, daysToShow - 1);

    const dateRange = eachDayOfInterval({
      start: startDate,
      end: today
    });

    const labels = dateRange.map(date => format(date, 'MMM dd'));

    const usageMap = new Map();
    usageStats.forEach(stat => {
      try {
        const statDate = parseISO(stat.date);
        const dateKey = format(statDate, 'yyyy-MM-dd');
        usageMap.set(dateKey, stat.activeDurationSec);
      } catch (error) {
        console.error("Error parsing date:", stat.date, error);
      }
    });

    const dataPoints = dateRange.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const durationSec = usageMap.get(dateKey) || 0;
      return durationSec / 3600;
    });

    setChartData({
      labels,
      datasets: [
        {
          label: 'Active Duration (hours)',
          data: dataPoints,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#047857',
          font: {
            size: 14,
            family: "'Inter', sans-serif"
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#065f46',
        bodyColor: '#047857',
        borderColor: '#d1fae5',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context) {
            const value = context.raw;
            const hours = Math.floor(value);
            const minutes = Math.round((value - hours) * 60);

            if (hours === 0 && minutes === 0) return 'No activity';
            if (hours === 0) return `${minutes} minutes`;
            if (minutes === 0) return `${hours} hours`;
            return `${hours}h ${minutes}m`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(209, 250, 229, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: '#047857',
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(209, 250, 229, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: '#047857',
          font: {
            size: 12
          },
          callback: function (value) {
            return value + 'h';
          }
        },
        title: {
          display: true,
          text: 'Active Duration (hours)',
          color: '#047857',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  };

  const getStatusBadge = (status, isBlocked) => {
    if (isBlocked) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Blocked</Badge>;
    }
  };

  const calculateTotalUsage = () => {
    if (!connectionData?.usageStats || connectionData.usageStats.length === 0) return 0;

    const totalSeconds = connectionData.usageStats.reduce((sum, stat) =>
      sum + (stat.activeDurationSec || 0), 0
    );

    return totalSeconds / 3600;
  };

  const calculateAverageUsage = () => {
    if (!connectionData?.usageStats || connectionData.usageStats.length === 0) return 0;

    const totalHours = calculateTotalUsage();
    const daysWithData = Math.max(connectionData.usageStats.length, 1);
    return totalHours / daysWithData;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0 && minutes === 0) return 'No activity';
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hours`;
    return `${hours}h ${minutes}m`;
  };

  const handleExportData = () => {
    if (!connectionData?.usageStats || connectionData.usageStats.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = [
      ['Date', 'Active Duration (hours)', 'Active Duration (minutes)', 'Active Duration (seconds)'],
      ...connectionData.usageStats.map(stat => [
        stat.date,
        ((stat.activeDurationSec || 0) / 3600).toFixed(2),
        ((stat.activeDurationSec || 0) / 60).toFixed(2),
        stat.activeDurationSec || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room-${connectionData.roomNumber}-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Data exported successfully');
  };

  const handleTimeRangeChange = (days) => {
    setTimeRange(days);
    setTimeout(() => {
      if (connectionData?.usageStats) {
        prepareChartData(connectionData.usageStats, days);
      }
    }, 10);
  };

  const blockName = blockData?.blockName || 'Unknown Block';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
          <p className="text-emerald-900 dark:text-emerald-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!connectionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Data Found</h3>
          <p className="text-gray-500 dark:text-gray-500 mb-6">Could not find analytics for this connection</p>
          <Button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br bg-white dark:bg-black">
      {/* Header */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-black backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/espConnetion/${allEspData.blockId}`)}
                className="self-start sm:self-center text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-400 truncate">
                    Room Analytics
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Room {connectionData.roomNumber}
                    </Badge>
                    {getStatusBadge(connectionData.status, connectionData.isBlocked)}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Sensor Pin: D{connectionData.sensorEspPin} → Room Pin: D{connectionData.roomEspPin}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">{blockName}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleExportData}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-900 font-medium h-10 sm:h-12 rounded-lg flex items-center justify-center group hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 shadow-lg transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="lg:w-1/3 flex flex-col justify-between space-y-4 sm:space-y-6">
            <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Total Usage
                </CardTitle>
                <CardDescription className="text-emerald-800 dark:text-emerald-300">
                  Overall active duration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-900 dark:text-emerald-400">
                    {calculateTotalUsage().toFixed(1)} <span className="text-xl">hours</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDuration(calculateTotalUsage() * 3600)}
                  </div>
                  <div className="pt-4 border-t border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Data Points:</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {connectionData.usageStats?.length || 0} days
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Usage Card */}
            <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Average Daily Usage
                </CardTitle>
                <CardDescription className="text-emerald-800 dark:text-emerald-300">
                  Per day average
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-900 dark:text-emerald-400">
                    {calculateAverageUsage().toFixed(2)} <span className="text-xl">hours/day</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDuration(calculateAverageUsage() * 3600)} per day
                  </div>
                  <div className="pt-4 border-t border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Time Range:</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        Last {timeRange} days
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section - Right Side */}
          <div className="lg:w-2/3 space-y-4 sm:space-y-6">
            {/* Chart Card */}
            <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-900 dark:text-emerald-400" />
                    <CardTitle className="text-emerald-900 dark:text-emerald-400">
                      Usage Analytics
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={timeRange === 7 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeRangeChange(7)}
                      className={`${timeRange === 7
                        ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-gray-900"
                        : "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                        }`}
                    >
                      7 Days
                    </Button>
                    <Button
                      variant={timeRange === 10 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeRangeChange(10)}
                      className={`${timeRange === 10
                        ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-gray-900"
                        : "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                        }`}
                    >
                      10 Days
                    </Button>
                    <Button
                      variant={timeRange === 30 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeRangeChange(30)}
                      className={`${timeRange === 30
                        ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-gray-900"
                        : "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                        }`}
                    >
                      30 Days
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-emerald-800 dark:text-emerald-300">
                  Active duration over time (hours) - Showing last {timeRange} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {chartData ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-500">Loading chart data...</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
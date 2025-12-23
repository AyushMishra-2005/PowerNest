"use client";
import React, { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "./ui/animated-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Plus } from "lucide-react";

export function AnimatedModal() {
  const [formData, setFormData] = useState({
    name: "",
    type: "Academic",
    sensor: "",
    room: "",
    description: ""
  });

  const blockTypes = [
    "Academic",
    "Events",
    "Laboratory",
    "Office",
    "Residential",
    "Recreation",
    "Food",
    "Healthcare"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New block data:", formData);
    setFormData({
      name: "",
      type: "Academic",
      sensor: "",
      room: "",
      description: ""
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex items-center justify-center">
      <Modal>
        <ModalTrigger
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-900 font-medium px-6 py-3 rounded-lg flex justify-center group/modal-btn hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 shadow-lg transition-all duration-300">
          <span
            className="group-hover/modal-btn:translate-x-40 text-center transition duration-500 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Block
          </span>
          <div
            className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 z-20">
            <Building className="h-5 w-5" />
          </div>
        </ModalTrigger>
        <ModalBody className="overflow-hidden">
          {/* Whole modal content wrapper with scroll */}
          <div className="max-h-[80vh] overflow-y-auto">
            <ModalContent>
              <div className="space-y-6 p-4">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                    <Building className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-400 mb-2">
                    Add New Building Block
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fill in the details to add a new block to your campus
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Block Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-emerald-800 dark:text-emerald-300">
                      Block Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter block name (e.g., Central Block)"
                      className="border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  {/* Block Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-emerald-800 dark:text-emerald-300">
                      Block Type *
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 focus:ring-emerald-500 focus:border-emerald-500">
                        <SelectValue placeholder="Select block type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800">
                        {blockTypes.map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            className="text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rooms & Devices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sensor" className="text-emerald-800 dark:text-emerald-300">
                        Sensor ESP ID *
                      </Label>
                      <div className="relative">
                        <Input
                          id="sensor"
                          name="sensor"
                          type="text"
                          value={formData.sensor}
                          onChange={handleChange}
                          placeholder="ESP_RELAY_ROOM_101"
                          className="border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 focus:ring-emerald-500 focus:border-emerald-500"
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="room" className="text-emerald-800 dark:text-emerald-300">
                        Room ESP ID *
                      </Label>
                      <div className="relative">
                        <Input
                          id="room"
                          name="room"
                          type="text"
                          value={formData.room}
                          onChange={handleChange}
                          placeholder="ESP_PIR_ROOM_101"
                          className="border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 focus:ring-emerald-500 focus:border-emerald-500"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-emerald-800 dark:text-emerald-300">
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the block's purpose and features..."
                      className="min-h-[100px] border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 focus:ring-emerald-500 focus:border-emerald-500 resize-y"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Provide a brief description of the building block
                    </p>
                  </div>
                </form>
              </div>
            </ModalContent>

            <ModalFooter className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-emerald-200 dark:border-emerald-800 mt-4 pt-4">
              <div className="flex justify-end">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 text-white dark:text-gray-900 font-medium px-5 py-2.5 rounded-lg text-sm shadow-lg transition-all duration-300 flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Block
                </button>
              </div>
            </ModalFooter>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
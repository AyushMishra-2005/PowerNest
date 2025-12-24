"use client";
import React, { useState, useRef, useEffect } from "react";
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
import { Building, Plus, ChevronDown } from "lucide-react";
import server from '../envirnoment.js'
import axios from "axios";
import { toast } from 'react-hot-toast'

export function AnimatedModal() {
  const [formData, setFormData] = useState({
    name: "",
    type: "Academic",
    sensor: "",
    room: "",
    description: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsSelectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Block name is required";
    if (!formData.sensor.trim()) newErrors.sensor = "Sensor ESP ID is required";
    if (!formData.room.trim()) newErrors.room = "Room ESP ID is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const formattedData = {
      blockName: formData.name,
      blockType: formData.type,
      blockDescription: formData.description,
      sensorEspId: formData.sensor,
      roomEspId: formData.room,
    }

    try {
      const { data } = await axios.post(
        `${server}/block/add-block`,
        formattedData,
        { withCredentials: true }
      );

      console.log(data.newBlock);
      toast.success("Block registered");
      setFormData({
        name: "",
        type: "Academic",
        sensor: "",
        room: "",
        description: ""
      });

    } catch (err) {
      console.log("Error during form submission:", err);
      toast.error("Error occurred.");
    }

    setErrors({});
    setIsSubmitting(false);
    setIsSelectOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }));
    setIsSelectOpen(false);
  };

  const toggleSelect = () => {
    setIsSelectOpen(!isSelectOpen);
  };

  return (
    <div className="flex items-center justify-center">
      <Modal>
        <ModalTrigger
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 text-white dark:text-gray-900 font-medium px-6 py-3 rounded-lg flex justify-center group/modal-btn hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 shadow-lg transition-all duration-300 cursor-pointer">
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
          <div className="max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <ModalContent>
                <div className="space-y-6 p-4">
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

                  <div className="space-y-5">
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
                        className={`border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 focus:ring-emerald-500 focus:border-emerald-500 ${errors.name ? "border-red-500 dark:border-red-500" : ""
                          }`}
                        required
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2" ref={selectRef}>
                      <Label className="text-emerald-800 dark:text-emerald-300">
                        Block Type *
                      </Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={toggleSelect}
                          className={`w-full flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-900 text-left ${errors.type ? "border-red-500 dark:border-red-500" : "border-emerald-300 dark:border-emerald-700"
                            } focus:ring-emerald-500 focus:border-emerald-500`}
                        >
                          <span className="text-emerald-800 dark:text-emerald-300">
                            {formData.type || "Select block type"}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-emerald-600 dark:text-emerald-400 transition-transform ${isSelectOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isSelectOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-md shadow-lg">
                            {blockTypes.map((type) => (
                              <div
                                key={type}
                                onClick={() => handleSelectChange(type)}
                                className={`px-3 py-2 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer ${formData.type === type ? "bg-emerald-50 dark:bg-emerald-900/30" : ""
                                  } first:rounded-t-md last:rounded-b-md`}
                              >
                                {type}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.type && (
                        <p className="text-sm text-red-500">{errors.type}</p>
                      )}
                    </div>

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
                            className={`border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 focus:ring-emerald-500 focus:border-emerald-500 ${errors.sensor ? "border-red-500 dark:border-red-500" : ""
                              }`}
                            required
                          />
                        </div>
                        {errors.sensor && (
                          <p className="text-sm text-red-500">{errors.sensor}</p>
                        )}
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
                            className={`border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 focus:ring-emerald-500 focus:border-emerald-500 ${errors.room ? "border-red-500 dark:border-red-500" : ""
                              }`}
                            required
                          />
                        </div>
                        {errors.room && (
                          <p className="text-sm text-red-500">{errors.room}</p>
                        )}
                      </div>
                    </div>

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
                        className={`min-h-[100px] border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 focus:ring-emerald-500 focus:border-emerald-500 resize-y ${errors.description ? "border-red-500 dark:border-red-500" : ""
                          }`}
                        required
                      />
                      {errors.description ? (
                        <p className="text-sm text-red-500">{errors.description}</p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Provide a brief description of the building block
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </ModalContent>

              <ModalFooter className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-emerald-200 dark:border-emerald-800 mt-4 pt-4">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-500 dark:to-emerald-400 hover:from-emerald-700 hover:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 text-white dark:text-gray-900 font-medium px-5 py-2.5 rounded-lg text-sm shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Add Block
                      </>
                    )}
                  </button>
                </div>
              </ModalFooter>
            </form>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
import { Router } from "express";

import secureRoute from "../middleware/secureRoute.js";

import {
  addSolarESP,
  deleteSolarESP,
  getSolarESPs,
  getRecentTelemetry,
} from "../controllers/solarEspController.controller.js";

const router = Router();

router.get("/", secureRoute, getSolarESPs);

router.post("/add", secureRoute, addSolarESP);

router.delete("/delete/:id", secureRoute, deleteSolarESP);

router.get(
  "/telemetry/:espId",
  secureRoute,
  getRecentTelemetry
);

export default router;
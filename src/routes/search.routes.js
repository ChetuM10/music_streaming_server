import express from "express";
import * as searchController from "../controllers/search.controller.js";

const router = express.Router();

// Public search route
router.get("/", searchController.search);

export default router;

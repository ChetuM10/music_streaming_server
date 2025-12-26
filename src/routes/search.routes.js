import express from "express";
import * as searchController from "../controllers/search.controller.js";

const router = express.Router();

// Public search route
router.get("/", searchController.search);

// Autocomplete suggestions
router.get("/suggestions", searchController.suggestions);

export default router;

import express from "express";
import { blogController } from "../controllers/blogController.js";

const router = express.Router();

router.post("/blog", blogController);

export default router;
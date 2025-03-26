import express from "express";
import { blogController } from "../controllers/blogController";

const router = express.Router();

router.post("/blog", blogController);

module.exports = router;
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const blogRoutes = require("./routes/blogRoutes");

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded())

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/v1", blogRoutes);
app.use("/ping", (req, res) => {res.send("pong")});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log("Server running on port", PORT));

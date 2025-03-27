import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import blogRoute from "./routes/blogRoute.js";

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use("/api/v1", blogRoute);
app.use("/ping", (req, res) => {
    res.send("pong");
});
app.use("/", (req, res) => {
    res.send("pong");
});

app.listen(PORT, () => {
    console.log("Server is up at port ", PORT);
});
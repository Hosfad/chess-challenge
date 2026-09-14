import express from "express";
import gameController from "./controllers/game.js";

const app = express();

app.use(express.json());
app.use("/api", gameController);

export default app;
import express from "express";
import { seedDemoData } from "../../controllers/demo.controller";

const demoRouter = express.Router();

demoRouter.get("/seed-demo", seedDemoData);

export default demoRouter;

import express from "express";
import { isAuthenticated, authorizeRoles } from "../../middlewares/auth.middleware";
import { uploadDPP, getDPPsByBatch, getSingleDPP, deleteDPP } from "../../controllers/dpp.controller";

const dppRouter = express.Router();

dppRouter.post("/upload-dpp", isAuthenticated, authorizeRoles("admin", "teacher"), uploadDPP);
dppRouter.get("/get-dpps/:batchId", isAuthenticated, getDPPsByBatch);
dppRouter.get("/get-dpp/:id", isAuthenticated, getSingleDPP);
dppRouter.delete("/delete-dpp/:id", isAuthenticated, authorizeRoles("admin", "teacher"), deleteDPP);

export default dppRouter;

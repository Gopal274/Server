import express from "express";
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from "../../controllers/layout.controller";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.middleware";

const layoutRouter = express.Router();

layoutRouter.post(
  "/create-layout",
  isAuthenticated,
  authorizeRoles("admin"),
  createLayout
);

layoutRouter.put(
  "/edit-layout",
  isAuthenticated,
  authorizeRoles("admin"),
  editLayout
);

layoutRouter.get("/get-layout/:type", getLayoutByType);

export default layoutRouter;

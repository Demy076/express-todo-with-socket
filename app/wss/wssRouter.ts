import { Router } from "express";
import { is_authenticated } from "../auth/middlewares/is_authenticated";
import * as mqtt from "mqtt";
import expressWs from "express-ws";
// Express ws import

export const wssRouter = Router({
  caseSensitive: false,
});
// @ts-ignore
expressWs(wssRouter);
wssRouter.use(is_authenticated);

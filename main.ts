import express, { NextFunction } from "express";
import { authRouter } from "./app/auth/auth_router";
import { PrismaClient, Sessions, Users } from "@prisma/client";
import cookieParser from "cookie-parser";
import { todoRouter } from "./app/todo/todo_router";
import * as mqtt from "mqtt";
import expressWs from "express-ws";
import { WebSocket } from "ws";
import { is_authenticated } from "./app/auth/middlewares/is_authenticated";

const mqttClient = mqtt.connect("mqtt://localhost:1883");
const app = express();
expressWs(app);

declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
      session?: Sessions & {
        user?: Users;
      };
      mqttClient: typeof mqttClient;
    }
    interface Application {
      ws: (
        path: string,
        callback: (ws: WebSocket, req: Request) => void
      ) => void;
    }
  }
}

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  req.mqttClient = mqttClient;
  next();
});

app.use((req, res, next) => {
  req.prisma = new PrismaClient();
  res.on("finish", async () => {
    try {
      await req.prisma.$disconnect();
    } catch (e) {
      console.log("Error disconnecting from database", e);
    }
  });
  next();
});
app.use("/auth", authRouter);
app.use("/todo", todoRouter);
app.use("/wss", is_authenticated);
app.ws("/wss", (ws, req) => {
  console.log("Websocket connection opened");
  let mqttClient: mqtt.MqttClient;
  try {
    console.log("Executing this line");
    mqttClient = mqtt.connect("mqtt://localhost:1883", {
      connectTimeout: 2000,
    });
    // Check for timeout
    mqttClient.on("error", (e) => {
      console.log("Error connecting to mqtt broker", e);
      //   CLose the connection
      ws.terminate();
    });

    mqttClient.on("connect", (d) => {
      console.log(d);
      ws.send(
        JSON.stringify({
          message: "Connected to mqtt broker",
        })
      );
      mqttClient
        .subscribe(`user-${req.session?.user?.id}`)
        .on("message", (topic, message) => {
          if (topic === `user-${req.session?.user?.id}`) {
            ws.send(message);
          }
        });
      ws.send(
        JSON.stringify({
          message: "Subscribed to user topic",
        })
      );
    });
  } catch (e) {
    console.log("Error connecting to mqtt broker", e);
    //   CLose the connection
    ws.terminate();
  }

  ws.on("close", () => {
    console.log("Websocket connection closed");
    if (mqttClient) {
      mqttClient.end();
    }
  });
});
app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});

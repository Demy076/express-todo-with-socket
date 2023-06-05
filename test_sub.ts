import * as mqtt from "mqtt";

const mqttClient = mqtt.connect("mqtt://localhost:1883", {
  connectTimeout: 2000,
});

mqttClient.publish("user-2", JSON.stringify({ message: "Hello" }));

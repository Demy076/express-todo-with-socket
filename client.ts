import { WebSocket } from "ws";

const ws = new WebSocket("ws://localhost:3000/wss", {
  headers: {
    cookie:
      "session=%242b%2410%240JWVTGzAPOErCzDG3OgA5ONcbhwcvPAdeMJYquFQdMot1jqzeG6YW",
  },
});

ws.on("message", (data) => {
  console.log(data.toString());
});

const express = require("express");
const app = express();
var http = require("http").createServer(app);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(http, {
  debug: true,
});
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});
const cors = require("cors");
const PORT = 3001 || process.env.PORT;

app.use(cors());
app.use("/peerjs", peerServer);
// Add headers
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

io.on("connection", (socket) => {
  socket.on("newConnection", (roomId, id) => {
    if (
      io.sockets.adapter.rooms.get(roomId) === undefined ||
      io.sockets.adapter.rooms.get(roomId).size < 2
    ) {
      console.log("New user joined the room", id);
      socket.join(roomId);
    }
  });

  socket.on("startCall", (roomId, id) => {
    console.log("owner is calling", roomId);
    socket.to(roomId).broadcast.emit("call", id);
  });

  socket.on("callAccepted", (roomId, id) => {
    socket.to(roomId).broadcast.emit("initiateTheCall", id);
  });

  socket.on("callRejected", (roomId) => {
    socket.to(roomId).broadcast.emit("callDeclined");
  });

  socket.on("callStarted", ({ roomId, id }) => {
    socket.to(roomId).broadcast.emit("videoCall", { id });
  });
  socket.on("initialized", ({ roomId }) => {
    socket.to(roomId).broadcast.emit("startVideo");
  });

  socket.on("endCall", (roomId) => {
    console.log("Call ended on room", roomId);
    socket.to(roomId).broadcast.emit("callEnded");
  });
});

http.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});

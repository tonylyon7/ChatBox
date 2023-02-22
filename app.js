const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  currentUser,
  userLeaves,
  getRoomUser,
} = require("./utils/users");
const botName = "TonyLyonCHAT bot";

const app = express();
const server = http.createServer(app);
const io = socketio(server);
let PORT = 3009;

//setting static files like the html and css
app.use(express.static(path.join(__dirname, "public")));

//Run when client server connect
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    //emit to the client only
    socket.emit("message", formatMessage(botName, "Welcome to TonyLyonCHAT !!"));

    //emit to everyone except the client
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );
    //Send users and room info\
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUser(user.room),
    });

    //Listen for chatMessage
    socket.on("chatMessage", (msg) => {
      io.emit("message", formatMessage(`${user.username}`, msg));
    });
  });
  //Run when client disconnect
  socket.on("disconnect", () => {
    const user = userLeaves(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      //Send users and room info\
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUser(user.room),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log("Running on Port 3009");
});

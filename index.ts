import express from "express";
import http from "http"
import socketio from "socket.io";

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {cors: {origin: "*"}});

app.get("/", (req:any, res: any) =>{
    res.render("index.ejs")
});

app.get("/error", (req:any, res: any) =>{
    const error = req.query.message;
    res.render("error.ejs", {
        error: error
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () =>{
    console.log(`server is online on http://localhost:${port}`)
});

io.on("connection", (socket: any) =>{
    console.log(socket.id)

    socket.on("online_bar_add", (data: string) =>{
        socket.emit("online_bar_add", data + "|" + socket.id)
        socket.broadcast.emit("online_bar_add", data + "|" + socket.id)
    });
    socket.on("disconnected", (data: string) =>{
        socket.broadcast.emit("disconnected" ,socket.id)
        console.log(data)
    });
    socket.on("message", (data: string) =>{
        socket.broadcast.emit("message", data)
        socket.emit("message", data)
    })
});
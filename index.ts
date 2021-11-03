import express from "express";
import http from "http"
import socketio from "socket.io";
import cookieParser from 'cookie-parser'

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {cors: {origin: "*"}});
const members: any = [];
var messages: any = [];
var admin_cookie: string = randomChar(40);


app.use(cookieParser());
app.get("/", (req:any, res: any) =>{
    var isAdmin;
    if(req.cookies.admin && req.cookies.admin == "I-am-An-Admin-No-One-can-st0p-m@"){
        isAdmin = true;
    }else{
        isAdmin = false;
    }
    res.render("index.ejs", {
        admin: isAdmin
    })
});

app.get("/admin", (req, res) =>{
    res.render("getAdmin.ejs", {
        cookie: admin_cookie
    })
})

app.get("/admin/reset", (req, res) =>{
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        admin_cookie = randomChar(100);
        res.redirect("/admin")
    }else{
        res.status(403).send({error: true, message: "Admin Only Page", code: 403});
    }
})

app.get("/online", (req, res) =>{
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        res.send(members)
    }else{
        res.status(403).send({error: true, message: "Admin Only Page", code: 403});
    }
})

app.get("/messages", (req, res) =>{
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        res.send(messages)
    }else{
        res.status(403).send({error: true, message: "Admin Only Page", code: 403});
    }
})

app.get("/messages/clear", (req, res) =>{
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        messages = [];
        res.redirect("/")
    }else{
        res.status(403).send({error: true, message: "Admin Only Page", code: 403});
    }
})

app.get("/error", (req:any, res: any) =>{
    const error = req.query.message;
    res.render("error.ejs", {
        error: error
    });
});
app.get("/*", (req, res) =>{
    res.status(404).send({error: true, message: "Page Not Found", code: 404});
    
})
const port = process.env.PORT || 3000;
server.listen(port, () =>{
    console.log(`server is online on http://localhost:${port}`)
});

io.on("connection", (socket: any) =>{
    console.log(socket.id)
    for (const member of members){
        socket.emit("online_bar_add", member)
        //console.log(member)
    }
    for(const message of messages){
        socket.emit('message', message)
    }
    socket.on("online_bar_add", (data: string) =>{
        socket.emit("online_bar_add", data + "|" + socket.id)
        socket.broadcast.emit("online_bar_add", data + "|" + socket.id)
        members.push(data + "|" + socket.id)
    });
    socket.on("disconnected", (data: string) =>{
        socket.broadcast.emit("disconnected" ,socket.id)
        //console.log(data)
        const index = members.indexOf(data + "|" + socket.id);
        //console.log(members);
        members.splice(index, 1);
        //console.log(members)
    });
    socket.on("message", (data: string) =>{
        socket.broadcast.emit("message", data)
        socket.emit("message", data)
        messages.push(data)
    })
});

function randomChar(length: number) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

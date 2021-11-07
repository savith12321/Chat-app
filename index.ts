import express from "express";
import http from "http"
import socketio from "socket.io";
import chalk from "chalk";
import config from "./config.json";
import cookieParser from 'cookie-parser';
import moment from "moment";
import {
    formatMessage
} from "./utils/messages"
import { 
    appendFile ,
    readFile
} from "fs";

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {cors: {origin: "*"}});
const members: any = [];
var messages: any = [];
var admin_cookie: string = randomChar(40);
var admin_pass: string = randomChar(60);


app.use(cookieParser());
app.use(express.static(`${__dirname}/assets`));
app.locals.basedir = `${__dirname}/assets`;

app.get("/", (req:any, res: any) =>{
    var id = "general"
    var isAdmin;
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        isAdmin = true;
    }else{
        isAdmin = false;
    }
    res.render("index.ejs", {
        admin: isAdmin,
        url: config.url,
        room: id
    })
});

app.get("/rooms/:id", (req:any, res: any) =>{
    var id = req.params.id;
    var isAdmin;
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        isAdmin = true;
    }else{
        isAdmin = false;
    }
    if (id == "admin" && isAdmin == false) return  res.status(403).send({
        error: true,
        message: "Admin Only Page", 
        code: 403
    });
    res.render("index.ejs", {
        admin: isAdmin,
        url: config.url,
        room: id
    })
});

app.get("/admin/pass/:pass", (req, res) =>{
    if (req.params.pass === admin_pass){
        res.cookie('admin', admin_cookie);
        admin_pass = randomChar(60)
        logger(`The old url is expired because of using it the new one is: ${config.url+ "/admin/" + admin_pass}`)
        res.redirect("/")
    }else{
        logger(`have you forget the admin url? here is that url again if you have forgotn the url: ${config.url+ "/admin/pass/" + admin_pass}`);
        res.status(401).send({error: true, message: "Unauthorized user", code: 401});
    }
})

app.get("/admin/reset", (req, res) =>{
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        admin_cookie = randomChar(100);
        res.redirect("/admin")
    }else{
        res.status(403).send({
            error: true,
            message: "Admin Only Page", 
            code: 403
        });
    }
})

app.get("/admin/chat", (req, res) =>{
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        var isAdmin;
        if(req.cookies.admin && req.cookies.admin == admin_cookie){
            isAdmin = true;
        }else{
            isAdmin = false;
        }
        res.render("index.ejs", {
            admin: isAdmin,
            url: config.url,
            room: "admin"
        })
    }else{
        res.status(403).send({
            error: true,
            message: "Admin Only Page", 
            code: 403
        });
    }
})

app.get("/logs", (req, res) =>{
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        readFile("app.log", (err, data) =>{
            if (err){
                res.send({
                    error: true,
                    message: "Unknown error occurred",
                    code: 500,
                })
            }else{
                res.send(`<code>${data}</code>`)
            }
        }) 
    }else{
        res.status(403).send({
            error: true,
            message: "Admin Only Page", 
            code: 403
        });
    }
})

app.get("/online", (req, res) =>{
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        res.send(members)
    }else{
        res.status(403).send({
            error: true,
            message: "Admin Only Page", 
            code: 403
        });
    }
})

app.get("/messages", (req, res) =>{
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        res.send(messages)
    }else{
        res.status(403).send({
            error: true,
            message: "Admin Only Page",
            code: 403
        });
    }
})

app.get("/messages/clear", (req, res) =>{
    if(req.cookies.admin && req.cookies.admin == admin_cookie){
        messages = [];
        res.redirect("/")
    }else{
        res.status(403).send({
            error: true, 
            message: "Admin Only Page", 
            code: 403
        });
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
    logger(`server is online on http://localhost:${port}`)
});

io.on("connection", (socket: any) =>{
    socket.on("joinRoom", (room : any) =>{
        socket.join(room.room)
        for (const member of members){
            if(member.room == room.room){
                socket.emit("online_bar_add", member)
            }
            //logger(member)
        }
        for(const message of messages){
            if(message.room === room.room){
                socket.emit('message', message)
            }
        }
        socket.broadcast.to(room.room).emit("message" , formatMessage("System", `hey, everyone Welcome ${room.name} to ${room.room}`, moment().format('h:mm a'), false, room.room, true, messages))
        socket.emit("message", formatMessage("System", `hey ${room.name}, Welcome to ${room.room}`, moment().format('h:mm a'), false, room.room, true, messages))
        socket.on("online_bar_add", (data: any) =>{
            var message = {
                username: data.username,
                id: socket.id,
                room: data.room
            }
            socket.emit("online_bar_add", message)
            socket.broadcast.to(room.room).emit("online_bar_add", message)
            members.push(message)
            logger(`member joined name = ${data.username} and socket_id = ${socket.id}`)
        });
    });
    socket.on("disconnected", (data: string) =>{
        socket.broadcast.emit("disconnected" , socket.id)
        //logger(data)
        const index = members.indexOf({username: data, id: socket.id});
        //logger(members);
        members.splice(index, 1);
        //logger(members)
    });
    socket.on("message", (data: any) =>{
        var message = formatMessage(data.username, data.message, data.time, data.admin, data.room, data.bot, messages)
        io.to(data.room).emit("message", message)
        messages.push(message)
    })
});

function randomChar(length: number) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
   return result;
}

const logger = (log : string) =>{
    let date_ob = new Date();

    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    // current hours
    let hours = date_ob.getHours();

    // current minutes
    let minutes = date_ob.getMinutes();

    // current seconds
    let seconds = date_ob.getSeconds();
    console.log(chalk.magenta(year + "-" + month + "-" + date + " | " + hours + ":" + minutes + ":" + seconds)+chalk.yellow(" :- ")+ chalk.green(log))
    appendFile("app.log", year + "-" + month + "-" + date + " | " + hours + ":" + minutes + ":" + seconds + " :- " + log +"<br>"+"\n", (err) => {
        if (err) console.log(err)
    });
}
logger(`If you want to make some one admin use this url: ${config.url+ "/admin/pass/" + admin_pass}`)

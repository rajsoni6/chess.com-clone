const express = require('express');
const Socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');
const { serialize } = require('v8');

const app = express();
const Server =  http.createServer(app);

// Socket.io initlizensence ....
const io = Socket(Server);

// chess initilizesen
const chess = new Chess();

let players = {};
let currentPlayers = "w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")))

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname,'public','index.html'));
})
app.get("/play",(req,res) => {
    res.render("index", {title: "Custom Chess Game"});
});

io.on('connection',(uniquesocket) => {
    console.log("connected..."+uniquesocket.id);
    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else{
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on('disconnect',()=> {
        console.log("disconnected..."+uniquesocket.id);

        if(uniquesocket.id == players.white){
            delete players.white;
        } else if (uniquesocket.id == players.black){
            delete players.black;
        }
    });

    uniquesocket.on("move", (move) => {
        try{
            if(chess.turn() === 'w' && uniquesocket.id !== players.white){
                return;
            } 
            if(chess.turn() === 'b' && uniquesocket.id !== players.black){
                return;
            } 

            const result = chess.move(move);

            if(result){
                currentPlayers = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            }
            else{
                console.log("Invalid Move :",move);
                uniquesocket.emit('invalidMove',move);
            }

        }catch(err){
            console.log(err);
            console.log("Invalid Move :",move);
            uniquesocket.emit('invalidMove',move);
        }

    })
})

Server.listen(3000,() => {
    console.log('Server on to http://localhost:3000/')
});
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const url = require('url');
const querystring = require('querystring');
const http = require('http');

const server = http.createServer(app);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const { Server } = require("socket.io");
const { connected } = require('process');
const io = new Server(server);

var connectedUsers = [];

function getNameFromId(id) {
    return connectedUsers.find((a) => a.id === id)?.name;
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/landing.html');
});

app.get('/chat', (req, res) => {
    let name = req.query.name;

    // check if the name is taken or not. This would need to be an endpoint before it even gets to this point but we check again to avoid errors

    if (name != null) {
        res.sendFile(__dirname + '/index.html');
    }
    else {
        res.sendFile(__dirname + '/landing.html');
    }
})

io.on('connection', (socket) => {

    console.log(socket.id + " connected");

    socket.emit('get name', {res: "we need your name"});

    socket.on('set name', (name) => {
        // check if we have a name
        let potentialUser = getNameFromId(socket.id);
        if (potentialUser) {
            potentialUser.name = name; // update it. Just incase it changed
            console.log("name received for " + socket.id + " name = " + name);
            return;
        }

        // check if we have the same name already
        potentialUser = connectedUsers.find(a => a.name === name);
        if (potentialUser) {
            console.log("Someone already has this name... Sorry")
            socket.emit('get new name', {res: "you need to get a new name"});
            return;
        }

        connectedUsers.push({ id: socket.id, name: name })
        console.log("name received for " + socket.id + " name = " + name);
    })

    socket.on('disconnect', () => {
        console.log("user disconnected");
        const index = connectedUsers.findIndex((a) => { a.id === socket.id});
        connectedUsers.splice(index, 1);
    })

    socket.on('chat message', (msg) => {

        const name = getNameFromId(socket.id);
        if (name === undefined)
        {
            socket.emit('get name', {res: "we need your name"});
            setTimeout(() => {
                io.emit('chat message', {msg: msg, sender: getNameFromId(socket.id)});
            }, 5000)

            return;
        }
        
        io.emit('chat message', {msg: msg, sender: getNameFromId(socket.id)});

        console.log("connected users", connectedUsers);
    })
});



server.listen(3000, () => {
    console.log('listening on *:3000');
});
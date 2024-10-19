const socketio = require("socket.io");
const Notification = require('../models/notification')
const {
    addUser,
    removeUser,
    updateLastSeen,
} = require("./socketFunctions");

let io = null;

const startSocket = (app) => {
    io = socketio(app, { pingInterval: 60000, pingTimeout: 25000 });
    io.use((socket, next) => {
        let userId = socket.handshake.query.userId;
        if (userId) {
            socket.userId = userId;
            return next();
        } else {
            socket.disconnect("unauthorized");
            next(new Error("Unauthorized"));
        }
    });
    io.use(async (socket, next) => {
        await addUser({ userId: socket.userId, id: socket.id }, "USER");
        await updateLastSeen(socket.userId, 1);
        next();
    });
    io.on("connection", async function(socket, next) {
        try {
            console.log("A user connected", socket.id);
            const {connectLynxWss} = require('./bot/grid/lynx/lynx_websocket')
            connectLynxWss(socket);
            let notific = await Notification.find({ user_id: socket.userId, read: false });
            if (notific) {
                io.sockets.to(socket.id).emit("new_notification", notific);
            }
         
            socket.on("disconnect", async () => {
                try {
                    await removeUser(socket.userId, socket.id, "USER");
                    await updateLastSeen(socket.userId, 0);
                } catch (err) {
                    console.log(err);
                }
            });
        } catch (error) {
            console.log(error.message);
        }
    });
};

const getSocket = () => io;

module.exports = {
    startSocket,
    getSocket
};
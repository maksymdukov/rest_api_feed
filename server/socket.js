let io;
let obj = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer);
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket is uninitialized');
        }
        return io;
    }
};
module.exports = obj;
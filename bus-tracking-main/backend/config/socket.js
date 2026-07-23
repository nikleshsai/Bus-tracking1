// Socket configuration placeholder

const socketIO = require('socket.io');

function initSocket(server) {
  return socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
}

module.exports = { initSocket };

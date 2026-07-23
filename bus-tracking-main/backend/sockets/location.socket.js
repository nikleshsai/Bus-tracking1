// Location socket placeholder

exports.initLocationSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected to location socket');

    socket.on('location:update', (data) => {
      io.emit('location:changed', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from location socket');
    });
  });
};

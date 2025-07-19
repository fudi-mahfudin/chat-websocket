const socket = io();

socket.on('message', (data) => {
  console.log(data);
});

socket.on('connect', () => {
  console.log('Connected to server', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server', socket.id);
});

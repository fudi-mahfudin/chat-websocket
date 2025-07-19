import express from 'express';
import { Server } from 'socket.io';
import {} from 'socket.io';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = new Server(server);

io.on('connection', (socket) => {
  console.log('Socket connecction established: ', socket.id);

  socket.emit('message', 'Welcome to the chat!');

  socket.on('disconnect', () => {
    console.log('Socket connection closed: ', socket.id);
  });
});

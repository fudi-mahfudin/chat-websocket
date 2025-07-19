import express from 'express';
import { Server } from 'socket.io';
import { addUser, users } from './controller/user.controller.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = new Server(server);

let onlineUsers = 0;

io.use((socket, next) => {
  const sessionId = socket.handshake.auth.sessionId;
  if (sessionId) {
    const session = users.find((x) => x.sessionId === sessionId);
    if (session) {
      socket.sessionId = sessionId;
      socket.id = session.id;
      socket.username = session.username;
      return next();
    }
  }

  socket.sessionId = Math.random().toString().slice(2);
  socket.id = socket.id;
  socket.username = socket.handshake.auth.username;
  addUser({
    id: socket.id,
    username: socket.username,
    sessionId: socket.sessionId,
  });
  return next();
});

io.on('connection', (socket) => {
  console.log('Socket connecction established: ', socket.id);
  onlineUsers++;

  socket.emit('session', {
    sessionId: socket.sessionId,
    id: socket.id,
    username: socket.username,
  });

  // emit users list to all clients
  io.emit('userList', users);

  socket.on('privateMessage', (msg, selectedClientId, callback) => {
    socket.to(selectedClientId).emit('broadcastMessage', msg);
    callback('Messge has been delivered');
  });

  socket.on('disconnect', () => {
    console.log('Socket connection closed: ', socket.id);
    onlineUsers--;
  });
});

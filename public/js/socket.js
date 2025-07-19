const socket = io({ autoConnect: false });

function onLoad() {
  console.log('complete render html');
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    socket.auth = { sessionId };
    socket.connect();
  } else {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    console.log(urlSearchParams.entries(), params);

    socket.auth = params;
    socket.connect();
  }
}

let selectedId = '';
const onUserSelect = (id, username) => {
  selectedId = id;
  const selectedUserTemplate = document.querySelector(
    '#selected_user_template'
  ).innerHTML;
  const selectedUserContainer = document.querySelector(
    '#selected_user_container'
  );

  const html = ejs.render(selectedUserTemplate, { username });
  selectedUserContainer.innerHTML = html;
};

socket.on('connect', () => {
  console.log('Connected to server', socket.id);
});

socket.on('session', ({ id, sessionId, username }) => {
  // to attach session on reconnect
  socket.auth = { sessionId };
  socket.id = id;

  // if user is not found then redirect to login page
  if (!username) {
    localStorage.removeItem('sessionId');
    window.location.href = '/';
  } else {
    localStorage.setItem('sessionId', sessionId);
  }
});

socket.on('userList', (connectedUsers) => {
  connectedUsers.map((user) => {
    if (user.id === socket.id) {
      user.self = true;
      user.username = `${user.username} (self)`;
    }
  });

  connectedUsers = connectedUsers.sort((a, b) => {
    if (a.self) return -1;
    if (b.self) return 1;
    if (a.username < b.username) return -1;
    return a.username > b.username ? 1 : 0;
  });

  console.log(connectedUsers);
  const userTemplate = document.querySelector(
    '#msg_userList_template'
  ).innerHTML;
  const userContainer = document.querySelector('#connected_users');

  const html = ejs.render(userTemplate, { connectedUsers });
  userContainer.innerHTML = html;
});

socket.on('broadcastMessage', (msg) => {
  const msgTemplate = document.querySelector('#msg_template').innerHTML;
  const msgContainer = document.querySelector('#msg_container');

  const html = ejs.render(msgTemplate, { message: msg });
  msgContainer.insertAdjacentHTML('beforeend', html);

  console.log(msg);
});

socket.on('broadcastImage', (msg) => {
  const imgTemplate = document.querySelector('#img_template').innerHTML;
  const msgContainer = document.querySelector('#msg_container');

  const html = ejs.render(imgTemplate, { base64Image: msg });
  msgContainer.insertAdjacentHTML('beforeend', html);
});

document.querySelector('#btn').addEventListener('click', (event) => {
  event.preventDefault();
  const textMessage = document.querySelector('#txtMessage');
  const msg = textMessage.value;
  const msgTemplate = document.querySelector('#msg_template').innerHTML;
  const msgContainer = document.querySelector('#msg_container');

  const html = ejs.render(msgTemplate, { message: msg });
  msgContainer.insertAdjacentHTML('beforeend', html);

  socket.emit('privateMessage', msg, selectedId, (notify) => {
    console.log('Acknowledgement from server: ', notify);
  });

  textMessage.value = '';
  textMessage.focus();
});

document.querySelector('#txtImage').addEventListener('change', (event) => {
  const data = event.target.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(data);
  reader.onload = (e) => {
    const base64Image = e.target.result;
    socket.emit('sendImage', base64Image);
  };
});

socket.on('disconnect', () => {
  console.log('Disconnected from server', socket.id);
});

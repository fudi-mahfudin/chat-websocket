const socket = io({ autoConnect: false });

function getCurrentTime() {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Use 24-hour format
  }).format(new Date());
}

function connectNewSocket() {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  console.log(urlSearchParams.entries(), params);

  socket.auth = params;
  socket.connect();
}

function onLoad() {
  console.log('complete render html');
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    socket.auth = { sessionId };
    socket.connect();
  } else {
    connectNewSocket();
  }
}

let selectedId = 'GROUP';

const onUserSelect = (id, username, el) => {
  document.querySelectorAll('.person').forEach((person) => {
    person.classList.remove('active-user');
  });
  el.classList.add('active-user');
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

socket.on('session', ({ id, sessionId, username, avatar }) => {
  // to attach session on reconnect
  socket.auth = { sessionId };
  socket.id = id;
  socket.username = username;
  socket.avatar = avatar;

  if (!username) {
    localStorage.removeItem('sessionId');
    socket.emit('removeUser');
    connectNewSocket();
    return;
  }

  localStorage.setItem('sessionId', sessionId);
});

socket.on('userList', (connectedUsers) => {
  // Save previous selected user
  const previousSelectedUser = document.querySelector('.active-user');

  console.log(connectedUsers);
  connectedUsers.map((user, index) => {
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

  const userTemplate = document.querySelector(
    '#msg_userList_template'
  ).innerHTML;
  const userContainer = document.querySelector('#connected_users');

  const html = ejs.render(userTemplate, { connectedUsers });
  userContainer.innerHTML = html;

  // Initial selected user
  if (previousSelectedUser && previousSelectedUser.dataset.chat !== 'GROUP') {
    const selectedUser = connectedUsers.find(
      (user) => user.id === previousSelectedUser.dataset.chat
    );
    onUserSelect(
      selectedUser.id,
      selectedUser.username,
      document.querySelector(`[data-chat="${selectedUser.id}"]`)
    );
  } else {
    onUserSelect('GROUP', 'Group', document.querySelector('.person'));
  }
});

socket.on('broadcastMessage', (msg, sender) => {
  const msgTemplate = document.querySelector('#msg_left_template').innerHTML;
  const msgContainer = document.querySelector('#msg_container');

  const html = ejs.render(msgTemplate, {
    message: msg,
    time: getCurrentTime(),
    username: sender.username,
    avatar: sender.avatar,
  });
  msgContainer.insertAdjacentHTML('beforeend', html);
});

socket.on('broadcastImage', (msg, sender) => {
  let imgTemplate = document.querySelector('#img_left_template').innerHTML;
  if (sender.id === socket.id) {
    imgTemplate = document.querySelector('#img_right_template').innerHTML;
  }
  const msgContainer = document.querySelector('#msg_container');

  const html = ejs.render(imgTemplate, {
    base64Image: msg,
    time: getCurrentTime(),
    username: sender.username,
    avatar: sender.avatar,
  });
  msgContainer.insertAdjacentHTML('beforeend', html);
});

document.querySelector('#btn').addEventListener('click', (event) => {
  event.preventDefault();
  const textMessage = document.querySelector('#txtMessage');
  const msg = textMessage.value;
  const msgTemplate = document.querySelector('#msg_right_template').innerHTML;
  const msgContainer = document.querySelector('#msg_container');

  const html = ejs.render(msgTemplate, {
    message: msg,
    time: getCurrentTime(),
    username: socket.username,
    avatar: socket.avatar,
  });
  msgContainer.insertAdjacentHTML('beforeend', html);

  if (selectedId && selectedId !== 'GROUP') {
    socket.emit('privateMessage', msg, selectedId, (notify) => {
      console.log('Acknowledgement from server: ', notify);
    });
  } else {
    socket.emit('groupMessage', msg, (notify) => {
      console.log('Acknowledgement from server: ', notify);
    });
  }

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

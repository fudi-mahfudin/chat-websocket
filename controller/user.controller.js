export const users = [];

export function addUser({ id, username, sessionId, avatar }) {
  const user = { id, username, sessionId, avatar };
  users.push(user);
  return user;
}

export function removeUser(id) {
  const userIndex = users.findIndex((user) => user.id === id);
  if (userIndex !== -1) {
    users.splice(userIndex, 1);
  }
}
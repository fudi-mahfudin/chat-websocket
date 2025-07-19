export const users = [];

export function addUser({ id, username, sessionId }) {
  const user = { id, username, sessionId };
  users.push(user);
  return user;
}

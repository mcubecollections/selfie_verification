const sessions = new Map();

function createSession(data) {
  const now = new Date();
  const session = {
    sessionId: data.sessionId,
    borrower: data.borrower,
    status: data.status || "pending",
    result: data.result || null,
    createdAt: now,
    updatedAt: now,
  };
  sessions.set(session.sessionId, session);
  return session;
}

function updateSessionStatus(sessionId, status, result) {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }
  session.status = status;
  if (typeof result !== "undefined") {
    session.result = result;
  }
  session.updatedAt = new Date();
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

module.exports = {
  createSession,
  updateSessionStatus,
  getSession,
};

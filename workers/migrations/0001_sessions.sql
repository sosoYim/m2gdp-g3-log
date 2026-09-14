CREATE TABLE sessions (
  id        TEXT PRIMARY KEY,
  uid       TEXT NOT NULL,
  email     TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at   TEXT
);
CREATE INDEX idx_sessions_uid ON sessions(uid);

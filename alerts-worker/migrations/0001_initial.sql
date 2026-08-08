CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  artists TEXT NOT NULL,
  events TEXT NOT NULL,
  kinds TEXT NOT NULL,
  manage_hash TEXT NOT NULL UNIQUE,
  verify_hash TEXT UNIQUE,
  verified_at TEXT,
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sent_notifications (
  subscription_id TEXT NOT NULL,
  alert_id TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  PRIMARY KEY (subscription_id, alert_id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS signup_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip_created ON signup_attempts(ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_verified ON subscriptions(verified_at);

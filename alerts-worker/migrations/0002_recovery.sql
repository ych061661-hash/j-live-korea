ALTER TABLE subscriptions ADD COLUMN recovery_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_recovery_hash ON subscriptions(recovery_hash);

-- User Messages Table for Direct Messaging
-- Run with: npx wrangler d1 execute proveloce_db --remote --file=./create_user_messages.sql

CREATE TABLE IF NOT EXISTS user_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_messages_sender ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_receiver ON user_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_conversation ON user_messages(sender_id, receiver_id);

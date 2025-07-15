-- OAuth states table for secure OAuth flows
-- Stores temporary state parameters to prevent CSRF attacks

CREATE TABLE oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  broker_id VARCHAR(50) NOT NULL,
  state VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, broker_id, state)
);

-- Index for cleanup and verification
CREATE INDEX idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX idx_oauth_states_user_broker ON oauth_states(user_id, broker_id);

-- RLS for oauth_states
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own OAuth states" ON oauth_states
  FOR ALL USING (user_id = auth.uid());

-- Function to clean up expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM oauth_states 
  WHERE expires_at < NOW();
END;
$$;

COMMENT ON TABLE oauth_states IS 'Temporary storage for OAuth state parameters to prevent CSRF attacks';
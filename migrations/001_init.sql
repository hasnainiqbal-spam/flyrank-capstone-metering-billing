CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plans (
  name TEXT PRIMARY KEY,
  api_call_limit INT NOT NULL,
  ai_token_limit INT NOT NULL
);
INSERT INTO plans VALUES ('free', 1000, 100000), ('pro', 50000, 5000000);

CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  type TEXT NOT NULL,
  quantity INT NOT NULL,
  idempotency_key TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE processed_webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_usage_tenant_created ON usage_events (tenant_id, created_at);
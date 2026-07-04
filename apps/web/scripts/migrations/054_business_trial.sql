-- İlk aktivləşdirmə sınaq müddəti izləmə
-- trial_granted_at: sınaq planı hansı tarixdə verildi (NULL = sınaq verilməyib)
ALTER TABLE business_plan_subscriptions
  ADD COLUMN IF NOT EXISTS trial_granted_at TIMESTAMPTZ NULL;

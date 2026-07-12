-- Allow owners to pause/archive service profiles without deleting rows.
ALTER TABLE service_listings DROP CONSTRAINT IF EXISTS service_listings_status_check;
ALTER TABLE service_listings
  ADD CONSTRAINT service_listings_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'paused', 'archived'));

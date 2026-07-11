-- Normalize legacy CRM lead stages if migration 061 was not applied yet
UPDATE leads SET stage = 'contacted' WHERE stage = 'in_progress';
UPDATE leads SET stage = 'visit_booked' WHERE stage IN ('test_drive', 'offer');
UPDATE leads SET stage = 'closed' WHERE stage = 'won';

-- Add dealer_apply and parts_apply to the support_requests type constraint

ALTER TABLE support_requests DROP CONSTRAINT IF EXISTS support_requests_type_check;

ALTER TABLE support_requests ADD CONSTRAINT support_requests_type_check CHECK (
  request_type IN (
    'question',
    'problem',
    'complaint',
    'partnership',
    'dealer_apply',
    'parts_apply',
    'inspection_partner',
    'data_export',
    'data_rectification',
    'data_deletion',
    'data_processing_objection',
    'other'
  )
);

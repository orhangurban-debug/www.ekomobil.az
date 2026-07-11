-- Salon profilləri yalnız avtomobil elanları göstərməlidir; hissələr mağaza profilində qalır.
UPDATE listings
SET dealer_profile_id = NULL, updated_at = NOW()
WHERE COALESCE(listing_kind, 'vehicle') = 'part'
  AND dealer_profile_id IS NOT NULL;

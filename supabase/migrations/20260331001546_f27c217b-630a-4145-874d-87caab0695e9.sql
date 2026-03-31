-- Tighten INSERT/UPDATE to require device_id in the row
DROP POLICY "Anyone can insert personalization" ON public.user_personalization;
DROP POLICY "Anyone can update personalization" ON public.user_personalization;

CREATE POLICY "Insert requires device_id"
  ON public.user_personalization FOR INSERT
  WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Update own personalization"
  ON public.user_personalization FOR UPDATE
  USING (device_id IS NOT NULL AND length(device_id) > 0);
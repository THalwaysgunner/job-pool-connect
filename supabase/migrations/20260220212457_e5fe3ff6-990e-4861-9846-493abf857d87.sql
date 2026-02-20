
CREATE OR REPLACE FUNCTION public.claim_job(_job_id uuid, _provider_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _rows INT;
BEGIN
  UPDATE public.jobs
  SET provider_user_id = _provider_id,
      status = 'in_progress',
      assigned_at = now()
  WHERE id = _job_id
    AND status = 'open_in_pool'
    AND provider_user_id IS NULL;
  
  GET DIAGNOSTICS _rows = ROW_COUNT;
  RETURN _rows > 0;
END;
$$;

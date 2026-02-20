
-- Enable realtime on jobs table for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- Function to notify all providers when a new job hits the pool
CREATE OR REPLACE FUNCTION public.notify_providers_new_pool_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _provider RECORD;
BEGIN
  IF NEW.status = 'open_in_pool' THEN
    FOR _provider IN
      SELECT user_id FROM public.user_roles WHERE role = 'provider'
    LOOP
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (
        _provider.user_id,
        'New Job Available',
        'A new job "' || NEW.business_name || '" has been added to the pool.',
        '/provider/pool'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on job insert
CREATE TRIGGER trigger_notify_providers_new_pool_job
AFTER INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.notify_providers_new_pool_job();

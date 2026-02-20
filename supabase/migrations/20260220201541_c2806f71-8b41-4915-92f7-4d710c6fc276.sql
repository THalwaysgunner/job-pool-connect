-- Add per-document review status
ALTER TABLE public.company_documents 
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN rejection_reason TEXT;

-- Add constraint for valid statuses
CREATE OR REPLACE FUNCTION public.validate_doc_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid document status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_company_doc_status
  BEFORE INSERT OR UPDATE ON public.company_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_doc_status();
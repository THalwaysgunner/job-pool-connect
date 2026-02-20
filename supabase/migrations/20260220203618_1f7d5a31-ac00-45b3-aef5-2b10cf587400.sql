-- Allow admins to update company documents (approve/reject)
CREATE POLICY "Admins can update company docs"
ON public.company_documents
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow senders to update their own messages
CREATE POLICY "Senders can update own messages"
ON public.job_messages FOR UPDATE
USING (auth.uid() = sender_user_id);

-- Allow senders to delete their own messages
CREATE POLICY "Senders can delete own messages"
ON public.job_messages FOR DELETE
USING (auth.uid() = sender_user_id);

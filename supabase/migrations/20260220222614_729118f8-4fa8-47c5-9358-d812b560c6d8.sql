
-- Add parent_message_id to job_messages for threading
ALTER TABLE public.job_messages ADD COLUMN parent_message_id uuid REFERENCES public.job_messages(id) DEFAULT NULL;

-- Create index for fast thread lookups
CREATE INDEX idx_job_messages_parent ON public.job_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.job_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS: participants can view reactions on messages they can see
CREATE POLICY "Job participants can view reactions"
ON public.message_reactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM job_messages jm
  JOIN jobs j ON j.id = jm.job_id
  WHERE jm.id = message_reactions.message_id
  AND (j.client_user_id = auth.uid() OR j.provider_user_id = auth.uid())
));

CREATE POLICY "Admins can view all reactions"
ON public.message_reactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can add reactions
CREATE POLICY "Job participants can add reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM job_messages jm
    JOIN jobs j ON j.id = jm.job_id
    WHERE jm.id = message_reactions.message_id
    AND (j.client_user_id = auth.uid() OR j.provider_user_id = auth.uid())
  )
);

-- Users can remove own reactions
CREATE POLICY "Users can delete own reactions"
ON public.message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

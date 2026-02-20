
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'provider');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 4. has_role function (security definer, no recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Company status enum
CREATE TYPE public.company_status AS ENUM ('draft', 'submitted_for_approval', 'approved', 'rejected');

-- 6. Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  details TEXT DEFAULT '',
  status company_status NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Company documents
CREATE TABLE public.company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  doc_type TEXT NOT NULL, -- 'registration_approval', 'company_id', 'accountant_approval'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Job status enum
CREATE TYPE public.job_status AS ENUM (
  'open_in_pool', 'in_progress', 'waiting_for_client_approval', 'done', 'closed_by_admin'
);

-- 9. Payment method enum
CREATE TYPE public.payment_method AS ENUM ('wire', 'credit_card', 'army_deposit');

-- 10. Jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID REFERENCES auth.users(id) NOT NULL,
  provider_user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  business_name TEXT NOT NULL,
  business_category TEXT NOT NULL,
  business_details TEXT DEFAULT '',
  payment_method payment_method NOT NULL DEFAULT 'wire',
  army_deposit_amount NUMERIC,
  status job_status NOT NULL DEFAULT 'open_in_pool',
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  waiting_approval_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Job documents (step 2 uploads)
CREATE TABLE public.job_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  doc_type TEXT NOT NULL, -- 'tax_payer', 'bituah_leumi', 'company_id_doc', 'bank_approval', 'other'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Job messages (chat thread)
CREATE TABLE public.job_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  sender_user_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Job questions (structured Q&A)
CREATE TYPE public.question_status AS ENUM ('open', 'answered');

CREATE TABLE public.job_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  provider_user_id UUID REFERENCES auth.users(id) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  status question_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ
);

-- 14. Payment requests
CREATE TYPE public.payment_request_status AS ENUM ('sent', 'paid_confirmed_by_client');

CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  provider_user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  details TEXT DEFAULT '',
  status payment_request_status NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- 15. Deliverables
CREATE TABLE public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  deliverable_type TEXT NOT NULL, -- 'website', 'strategy_plan', 'ads_plan', 'invoice'
  website_url TEXT,
  website_credentials TEXT,
  file_name TEXT,
  file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Disputes
CREATE TYPE public.dispute_status AS ENUM ('open', 'resolved');

CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  client_user_id UUID REFERENCES auth.users(id) NOT NULL,
  reason TEXT NOT NULL,
  resolution TEXT,
  status dispute_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 17. Admin legal files
CREATE TABLE public.admin_legal_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_type TEXT NOT NULL, -- 'terms_client', 'terms_provider', 'contract_client', 'contract_provider'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. User legal acceptances
CREATE TABLE public.user_legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  legal_file_id UUID REFERENCES public.admin_legal_files(id) ON DELETE CASCADE NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, legal_file_id)
);

-- 19. Admin alerts (AI compliance)
CREATE TABLE public.admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ RLS ============

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own companies" ON public.companies FOR SELECT TO authenticated USING (auth.uid() = client_user_id);
CREATE POLICY "Admins can view all companies" ON public.companies FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can insert own companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_user_id AND public.has_role(auth.uid(), 'client'));
CREATE POLICY "Clients can update own companies" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = client_user_id);
CREATE POLICY "Admins can update all companies" ON public.companies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Company documents
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own company docs" ON public.company_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.client_user_id = auth.uid()));
CREATE POLICY "Admins can view all company docs" ON public.company_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can insert own company docs" ON public.company_documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.client_user_id = auth.uid()));
CREATE POLICY "Clients can delete own company docs" ON public.company_documents FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.client_user_id = auth.uid()));

-- Jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own jobs" ON public.jobs FOR SELECT TO authenticated USING (auth.uid() = client_user_id);
CREATE POLICY "Providers can view assigned jobs" ON public.jobs FOR SELECT TO authenticated USING (auth.uid() = provider_user_id);
CREATE POLICY "Providers can view pool jobs" ON public.jobs FOR SELECT TO authenticated USING (status = 'open_in_pool' AND public.has_role(auth.uid(), 'provider'));
CREATE POLICY "Admins can view all jobs" ON public.jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_user_id AND public.has_role(auth.uid(), 'client'));
CREATE POLICY "Admins can update all jobs" ON public.jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Providers can update assigned jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = provider_user_id);
CREATE POLICY "Clients can update own jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = client_user_id);

-- Job documents
ALTER TABLE public.job_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job participants can view job docs" ON public.job_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.client_user_id = auth.uid() OR j.provider_user_id = auth.uid())));
CREATE POLICY "Admins can view all job docs" ON public.job_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can insert job docs" ON public.job_documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_user_id = auth.uid()));

-- Job messages
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job participants can view messages" ON public.job_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.client_user_id = auth.uid() OR j.provider_user_id = auth.uid())));
CREATE POLICY "Admins can view all messages" ON public.job_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Job participants can send messages" ON public.job_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_user_id AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.client_user_id = auth.uid() OR j.provider_user_id = auth.uid())));

-- Job questions
ALTER TABLE public.job_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job participants can view questions" ON public.job_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.client_user_id = auth.uid() OR j.provider_user_id = auth.uid())));
CREATE POLICY "Admins can view all questions" ON public.job_questions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Providers can ask questions" ON public.job_questions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = provider_user_id AND public.has_role(auth.uid(), 'provider'));
CREATE POLICY "Clients can answer questions" ON public.job_questions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_user_id = auth.uid()));

-- Payment requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job participants can view payment requests" ON public.payment_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.client_user_id = auth.uid() OR j.provider_user_id = auth.uid())));
CREATE POLICY "Admins can view all payment requests" ON public.payment_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Providers can create payment requests" ON public.payment_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = provider_user_id AND public.has_role(auth.uid(), 'provider'));
CREATE POLICY "Clients can update payment requests" ON public.payment_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_user_id = auth.uid()));

-- Deliverables
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job participants can view deliverables" ON public.deliverables FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.client_user_id = auth.uid() OR j.provider_user_id = auth.uid())));
CREATE POLICY "Admins can view all deliverables" ON public.deliverables FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Providers can insert deliverables" ON public.deliverables FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.provider_user_id = auth.uid()));
CREATE POLICY "Providers can update deliverables" ON public.deliverables FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.provider_user_id = auth.uid()));

-- Disputes
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own disputes" ON public.disputes FOR SELECT TO authenticated USING (auth.uid() = client_user_id);
CREATE POLICY "Admins can view all disputes" ON public.disputes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can create disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_user_id);
CREATE POLICY "Admins can update disputes" ON public.disputes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin legal files
ALTER TABLE public.admin_legal_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view legal files" ON public.admin_legal_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert legal files" ON public.admin_legal_files FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update legal files" ON public.admin_legal_files FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User legal acceptances
ALTER TABLE public.user_legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own acceptances" ON public.user_legal_acceptances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own acceptances" ON public.user_legal_acceptances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all acceptances" ON public.user_legal_acceptances FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin alerts
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all alerts" ON public.admin_alerts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update alerts" ON public.admin_alerts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert alerts" ON public.admin_alerts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ Triggers ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON public.deliverables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Atomic job claim function ============
CREATE OR REPLACE FUNCTION public.claim_job(_job_id UUID, _provider_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _claimed BOOLEAN;
BEGIN
  UPDATE public.jobs
  SET provider_user_id = _provider_id,
      status = 'in_progress',
      assigned_at = now()
  WHERE id = _job_id
    AND status = 'open_in_pool'
    AND provider_user_id IS NULL;
  
  GET DIAGNOSTICS _claimed = ROW_COUNT;
  RETURN _claimed > 0;
END;
$$;

-- ============ Storage buckets ============
INSERT INTO storage.buckets (id, name, public) VALUES ('company-documents', 'company-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('job-documents', 'job-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('deliverables', 'deliverables', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('legal-files', 'legal-files', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload company docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-documents');
CREATE POLICY "Users can view own company docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'company-documents');
CREATE POLICY "Authenticated users can upload job docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'job-documents');
CREATE POLICY "Users can view job docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'job-documents');
CREATE POLICY "Authenticated users can upload deliverables" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deliverables');
CREATE POLICY "Users can view deliverables" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'deliverables');
CREATE POLICY "Anyone can view legal files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'legal-files');
CREATE POLICY "Admins can upload legal files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'legal-files');

-- Enable realtime for notifications and job messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_messages;

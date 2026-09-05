--
-- PostgreSQL database dump
--

\restrict 5HsKXoRgoFPa0E2N5fJzpO2p9RqF4TDVWSB9ZtysfqtXNd06olJyHMfucZ6HVmi

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: cleanup_support(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_support() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  -- waiting too long with nobody picking up -> cancelled
  update support_sessions
     set status = 'cancelled', ended_at = now()
   where status = 'waiting' and created_at < now() - interval '30 minutes';

  -- active but silent for 2h -> ended
  update support_sessions
     set status = 'ended', ended_at = now()
   where status = 'active' and started_at < now() - interval '2 hours';

  -- no message ever outlives its session
  delete from support_messages m
   using support_sessions s
   where m.session_id = s.id and s.status in ('ended', 'cancelled');

  -- mentors that stopped heart-beating are offline
  update mentor_presence
     set is_online = false
   where is_online is true and last_seen < now() - interval '2 minutes';
end;
$$;


--
-- Name: end_support_session(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.end_support_session(p_session uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if not exists (
    select 1 from support_sessions s
    where s.id = p_session and (auth.uid() = s.user_id or auth.uid() = s.mentor_id)
  ) then
    raise exception 'not a participant of this session';
  end if;

  delete from support_messages where session_id = p_session;

  update support_sessions
     set status = 'ended', ended_at = now(), ended_by = auth.uid()
   where id = p_session;
end;
$$;


--
-- Name: is_mentor_uid(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_mentor_uid(uid uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select coalesce((select is_mentor from public.profiles where id = uid), false);
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin new.updated_at = now(); return new; end $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text,
    image_url text NOT NULL,
    image_path text NOT NULL,
    link_url text,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    slug text NOT NULL,
    thumbnail_url text,
    content text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    CONSTRAINT blog_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    code text NOT NULL,
    recipient_name text NOT NULL,
    kind text DEFAULT 'bronze'::text NOT NULL,
    percent integer NOT NULL,
    title text DEFAULT 'Digital Marketing'::text NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT certificates_kind_check CHECK ((kind = ANY (ARRAY['gold'::text, 'silver'::text, 'bronze'::text])))
);


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    rating integer,
    suggestion text DEFAULT ''::text NOT NULL,
    review text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 10)))
);


--
-- Name: initial_assessment_category_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initial_assessment_category_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    category text NOT NULL,
    correct integer NOT NULL,
    total integer NOT NULL,
    percent integer NOT NULL
);


--
-- Name: initial_assessment_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initial_assessment_results (
    profile_id uuid NOT NULL,
    correct integer NOT NULL,
    total integer NOT NULL,
    percent integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: login_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mentor_presence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentor_presence (
    mentor_id uuid NOT NULL,
    is_online boolean DEFAULT false NOT NULL,
    last_seen timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: practice_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    track_slug text NOT NULL,
    correct integer NOT NULL,
    total integer NOT NULL,
    earned_weight integer NOT NULL,
    max_weight integer NOT NULL,
    percent integer NOT NULL,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: practice_best_scores; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.practice_best_scores WITH (security_invoker='on') AS
 SELECT profile_id,
    track_slug,
    max(percent) AS percent,
    count(*) AS attempts,
    max(attempted_at) AS last_attempt_at
   FROM public.practice_attempts
  GROUP BY profile_id, track_slug;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    headline text,
    location text,
    avatar_url text,
    banner_url text,
    phone text,
    date_of_birth date,
    gender text,
    country text,
    state text,
    career_stage text,
    goals jsonb DEFAULT '[]'::jsonb NOT NULL,
    skills jsonb DEFAULT '[]'::jsonb NOT NULL,
    experience jsonb DEFAULT '[]'::jsonb NOT NULL,
    education jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assessment jsonb,
    practice jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_mentor boolean DEFAULT false NOT NULL
);


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);

ALTER TABLE ONLY public.support_messages REPLICA IDENTITY FULL;


--
-- Name: support_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mentor_id uuid,
    topic text DEFAULT ''::text NOT NULL,
    details text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'waiting'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    ended_by uuid,
    user_seen_at timestamp with time zone,
    mentor_seen_at timestamp with time zone,
    user_typing_at timestamp with time zone,
    mentor_typing_at timestamp with time zone,
    CONSTRAINT support_sessions_status_check CHECK ((status = ANY (ARRAY['waiting'::text, 'active'::text, 'ended'::text, 'cancelled'::text])))
);

ALTER TABLE ONLY public.support_sessions REPLICA IDENTITY FULL;


--
-- Name: test_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    track_slug text NOT NULL,
    correct integer NOT NULL,
    total integer NOT NULL,
    percent integer NOT NULL,
    passed boolean DEFAULT false NOT NULL,
    taken_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: test_best_scores; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.test_best_scores AS
 SELECT profile_id,
    track_slug,
    max(percent) AS percent,
    bool_or(passed) AS passed,
    count(*) AS attempts,
    max(taken_at) AS last_attempt_at
   FROM public.test_attempts
  GROUP BY profile_id, track_slug;


--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: certificates certificates_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_code_key UNIQUE (code);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_profile_id_key UNIQUE (profile_id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: initial_assessment_category_scores initial_assessment_category_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initial_assessment_category_scores
    ADD CONSTRAINT initial_assessment_category_scores_pkey PRIMARY KEY (id);


--
-- Name: initial_assessment_category_scores initial_assessment_category_scores_profile_id_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initial_assessment_category_scores
    ADD CONSTRAINT initial_assessment_category_scores_profile_id_category_key UNIQUE (profile_id, category);


--
-- Name: initial_assessment_results initial_assessment_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initial_assessment_results
    ADD CONSTRAINT initial_assessment_results_pkey PRIMARY KEY (profile_id);


--
-- Name: login_events login_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_events
    ADD CONSTRAINT login_events_pkey PRIMARY KEY (id);


--
-- Name: mentor_presence mentor_presence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_presence
    ADD CONSTRAINT mentor_presence_pkey PRIMARY KEY (mentor_id);


--
-- Name: practice_attempts practice_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_attempts
    ADD CONSTRAINT practice_attempts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: support_sessions support_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_sessions
    ADD CONSTRAINT support_sessions_pkey PRIMARY KEY (id);


--
-- Name: test_attempts test_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_pkey PRIMARY KEY (id);


--
-- Name: ads_active_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ads_active_order_idx ON public.ads USING btree (active, sort_order);


--
-- Name: blog_posts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_status_idx ON public.blog_posts USING btree (status, published_at DESC);


--
-- Name: certificates_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX certificates_code_idx ON public.certificates USING btree (code);


--
-- Name: feedback_profile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feedback_profile_idx ON public.feedback USING btree (profile_id, created_at DESC);


--
-- Name: iacs_profile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX iacs_profile_idx ON public.initial_assessment_category_scores USING btree (profile_id);


--
-- Name: login_events_profile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX login_events_profile_idx ON public.login_events USING btree (profile_id, at DESC);


--
-- Name: practice_attempts_profile_track_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX practice_attempts_profile_track_idx ON public.practice_attempts USING btree (profile_id, track_slug, attempted_at DESC);


--
-- Name: support_messages_session_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX support_messages_session_idx ON public.support_messages USING btree (session_id, created_at);


--
-- Name: support_sessions_queue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX support_sessions_queue_idx ON public.support_sessions USING btree (status, created_at);


--
-- Name: support_sessions_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX support_sessions_user_idx ON public.support_sessions USING btree (user_id, created_at DESC);


--
-- Name: test_attempts_profile_track_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX test_attempts_profile_track_idx ON public.test_attempts USING btree (profile_id, track_slug, taken_at DESC);


--
-- Name: ads ads_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ads_set_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: blog_posts blog_posts_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER blog_posts_set_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: profiles profiles_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: certificates certificates_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: feedback feedback_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: initial_assessment_category_scores initial_assessment_category_scores_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initial_assessment_category_scores
    ADD CONSTRAINT initial_assessment_category_scores_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: initial_assessment_results initial_assessment_results_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initial_assessment_results
    ADD CONSTRAINT initial_assessment_results_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: login_events login_events_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_events
    ADD CONSTRAINT login_events_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: mentor_presence mentor_presence_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_presence
    ADD CONSTRAINT mentor_presence_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: practice_attempts practice_attempts_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_attempts
    ADD CONSTRAINT practice_attempts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.support_sessions(id) ON DELETE CASCADE;


--
-- Name: support_sessions support_sessions_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_sessions
    ADD CONSTRAINT support_sessions_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: support_sessions support_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_sessions
    ADD CONSTRAINT support_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: test_attempts test_attempts_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

--
-- Name: ads ads_public_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ads_public_read_active ON public.ads FOR SELECT USING ((active = true));


--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_posts blog_posts admin all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "blog_posts admin all" ON public.blog_posts TO anon USING (true) WITH CHECK (true);


--
-- Name: blog_posts blog_posts public read published; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "blog_posts public read published" ON public.blog_posts FOR SELECT USING ((status = 'published'::text));


--
-- Name: certificates cert_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cert_insert_own ON public.certificates FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: certificates cert_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cert_select_own ON public.certificates FOR SELECT USING ((auth.uid() = profile_id));


--
-- Name: certificates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

--
-- Name: feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: feedback feedback_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feedback_insert_own ON public.feedback FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: feedback feedback_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feedback_select_own ON public.feedback FOR SELECT USING ((auth.uid() = profile_id));


--
-- Name: initial_assessment_category_scores iacs_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY iacs_insert_own ON public.initial_assessment_category_scores FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: initial_assessment_category_scores iacs_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY iacs_select_own ON public.initial_assessment_category_scores FOR SELECT USING ((auth.uid() = profile_id));


--
-- Name: initial_assessment_category_scores iacs_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY iacs_update_own ON public.initial_assessment_category_scores FOR UPDATE USING ((auth.uid() = profile_id)) WITH CHECK ((auth.uid() = profile_id));


--
-- Name: initial_assessment_results iar_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY iar_insert_own ON public.initial_assessment_results FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: initial_assessment_results iar_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY iar_select_own ON public.initial_assessment_results FOR SELECT USING ((auth.uid() = profile_id));


--
-- Name: initial_assessment_results iar_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY iar_update_own ON public.initial_assessment_results FOR UPDATE USING ((auth.uid() = profile_id)) WITH CHECK ((auth.uid() = profile_id));


--
-- Name: initial_assessment_category_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.initial_assessment_category_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: initial_assessment_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.initial_assessment_results ENABLE ROW LEVEL SECURITY;

--
-- Name: login_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

--
-- Name: login_events login_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY login_insert_own ON public.login_events FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: mentor_presence; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mentor_presence ENABLE ROW LEVEL SECURITY;

--
-- Name: support_messages messages_delete_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_delete_participants ON public.support_messages FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.support_sessions s
  WHERE ((s.id = support_messages.session_id) AND ((auth.uid() = s.user_id) OR (auth.uid() = s.mentor_id))))));


--
-- Name: support_messages messages_insert_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_insert_participants ON public.support_messages FOR INSERT WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.support_sessions s
  WHERE ((s.id = support_messages.session_id) AND (s.status = 'active'::text) AND ((auth.uid() = s.user_id) OR (auth.uid() = s.mentor_id)))))));


--
-- Name: support_messages messages_select_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_select_participants ON public.support_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.support_sessions s
  WHERE ((s.id = support_messages.session_id) AND ((auth.uid() = s.user_id) OR (auth.uid() = s.mentor_id))))));


--
-- Name: support_messages messages_update_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_update_participants ON public.support_messages FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM public.support_sessions s
  WHERE ((s.id = support_messages.session_id) AND ((auth.uid() = s.user_id) OR (auth.uid() = s.mentor_id))))) AND (sender_id <> auth.uid())));


--
-- Name: practice_attempts pa_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pa_insert_own ON public.practice_attempts FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: practice_attempts pa_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pa_select_own ON public.practice_attempts FOR SELECT USING ((auth.uid() = profile_id));


--
-- Name: practice_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: mentor_presence presence_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY presence_read_all ON public.mentor_presence FOR SELECT USING (true);


--
-- Name: mentor_presence presence_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY presence_update_own ON public.mentor_presence FOR UPDATE USING ((auth.uid() = mentor_id));


--
-- Name: mentor_presence presence_upsert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY presence_upsert_own ON public.mentor_presence FOR INSERT WITH CHECK ((auth.uid() = mentor_id));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles profiles_select_mentors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_mentors ON public.profiles FOR SELECT USING ((is_mentor IS TRUE));


--
-- Name: profiles profiles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: profiles profiles_select_support_peer; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_support_peer ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.support_sessions s
  WHERE (((s.user_id = profiles.id) AND (s.mentor_id = auth.uid())) OR ((s.mentor_id = profiles.id) AND (s.user_id = auth.uid())) OR ((s.user_id = profiles.id) AND (s.status = 'waiting'::text) AND public.is_mentor_uid(auth.uid()))))));


--
-- Name: profiles profiles_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: support_sessions sessions_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sessions_insert_own ON public.support_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_sessions sessions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sessions_select ON public.support_sessions FOR SELECT USING (((auth.uid() = user_id) OR (auth.uid() = mentor_id) OR ((status = 'waiting'::text) AND public.is_mentor_uid(auth.uid()))));


--
-- Name: support_sessions sessions_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sessions_update ON public.support_sessions FOR UPDATE USING (((auth.uid() = user_id) OR (auth.uid() = mentor_id) OR ((status = 'waiting'::text) AND public.is_mentor_uid(auth.uid()))));


--
-- Name: support_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: support_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: test_attempts ta_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ta_insert_own ON public.test_attempts FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: test_attempts ta_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ta_select_own ON public.test_attempts FOR SELECT USING ((auth.uid() = profile_id));


--
-- Name: test_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 5HsKXoRgoFPa0E2N5fJzpO2p9RqF4TDVWSB9ZtysfqtXNd06olJyHMfucZ6HVmi


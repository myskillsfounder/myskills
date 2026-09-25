-- Practice scores you can trust: server-side grading for the 8 skill tracks.
--
-- BEFORE: the browser graded each practice attempt and wrote the percentage
-- straight into practice_attempts. The correct answers shipped in the JS
-- bundle, and RLS only checked WHO was writing (auth.uid() = profile_id), not
-- WHAT — so anyone could insert 100% for every track with one request. That
-- mattered once finishing all 8 tracks became the gate for a mentor review.
--
-- AFTER: the answer key lives in a table no client can read. The browser sends
-- its answers to submit_practice_attempt(), which grades them, records the
-- attempt itself and returns the score with the explanations. There is no
-- longer any way to write a practice score directly.
--
-- Run once against Supabase Cloud (SQL editor), BEFORE deploying the matching
-- frontend (the new site calls submit_practice_attempt). Safe to re-run.
-- The frontend that ships with this no longer contains the answers, so this
-- file is the only copy — keep it. Regenerate it from the xlsx if the
-- scenarios change.
--
-- SCORE RULE: a track's score is the best of the learner's last 3 attempts
-- (practice_best_scores below). Retries are still allowed, but an old lucky
-- attempt can't hold the score up forever.
--
-- EXISTING ROWS: attempts written by the old browser grading stay, and still
-- count (server_graded = false) so nobody loses the progress they made. They
-- can't be verified. To count only server-graded attempts later:
--   update public.practice_attempts set percent = 0 where not server_graded;
-- (or delete them) — the column is there so that is a deliberate choice.

-- ---------------------------------------------------------------------------
-- 1. The answer key — no client-facing policy at all (RLS on, zero grants).
--    Only the security-definer function below can read it.
-- ---------------------------------------------------------------------------
create table if not exists public.decision_lab_answer_key (
  question_id      text primary key,
  track_slug       text not null,
  weight           int  not null check (weight > 0),
  correct_index    int  not null check (correct_index between 0 and 3),
  why_correct      text not null,
  why_others_wrong text not null,
  learning_outcome text not null
);

create index if not exists decision_lab_answer_key_track_idx
  on public.decision_lab_answer_key (track_slug);

alter table public.decision_lab_answer_key enable row level security;

insert into public.decision_lab_answer_key
  (question_id, track_slug, weight, correct_index, why_correct, why_others_wrong, learning_outcome)
values
  ($k$MF-S001$k$, $k$marketing-fundamentals$k$, 5, 2, $k$Google Search captures people actively searching for courses, making it the fastest source of qualified demand for a new brand.$k$, $k$SEO is slow, Meta lacks historical data for optimisation, and influencer campaigns build awareness but not predictable lead volume.$k$, $k$Selecting channels based on business goals and customer intent.$k$),
  ($k$MF-S002$k$, $k$marketing-fundamentals$k$, 5, 1, $k$Launching with the highest-intent segment improves learning and ROI.$k$, $k$Broad targeting wastes budget while teenagers are unlikely buyers.$k$, $k$Market segmentation and audience prioritisation.$k$),
  ($k$MF-S003$k$, $k$marketing-fundamentals$k$, 10, 2, $k$The business is attracting visitors but failing to convert them into customers.$k$, $k$Traffic is already strong; retention becomes important after purchases increase.$k$, $k$Diagnosing customer journey bottlenecks.$k$),
  ($k$MF-S004$k$, $k$marketing-fundamentals$k$, 10, 1, $k$A differentiated benefit targeted at a specific audience creates stronger positioning.$k$, $k$Price alone starts a race to the bottom; logistics are not unique customer benefits.$k$, $k$Creating compelling value propositions.$k$),
  ($k$MF-S005$k$, $k$marketing-fundamentals$k$, 10, 1, $k$Focused positioning creates stronger messaging and better optimisation.$k$, $k$Trying to serve everyone usually weakens campaign performance.$k$, $k$Applying STP in real decisions.$k$),
  ($k$MF-S006$k$, $k$marketing-fundamentals$k$, 10, 1, $k$Improving the conversion step has the highest impact before increasing traffic.$k$, $k$Brand assets don't address the bottleneck.$k$, $k$Marketing funnel optimisation.$k$),
  ($k$MF-S007$k$, $k$marketing-fundamentals$k$, 15, 1, $k$Competing on value is more sustainable than reacting solely on price.$k$, $k$Price wars erode profitability and are difficult to sustain.$k$, $k$Competitive positioning.$k$),
  ($k$MF-S008$k$, $k$marketing-fundamentals$k$, 15, 1, $k$A diversified plan captures both active buyers and future prospects.$k$, $k$Single-channel strategies increase risk and miss parts of the buyer journey.$k$, $k$Strategic budget allocation.$k$),
  ($k$MF-S009$k$, $k$marketing-fundamentals$k$, 15, 1, $k$Retaining existing customers is generally more cost-effective than constantly acquiring new ones.$k$, $k$More acquisition increases costs without fixing the root problem.$k$, $k$Customer retention strategy.$k$),
  ($k$MF-S010$k$, $k$marketing-fundamentals$k$, 15, 1, $k$An integrated strategy builds long-term assets while continuing to generate leads.$k$, $k$Single-channel dependence increases business risk.$k$, $k$Integrated marketing planning.$k$),
  ($k$MR-S001$k$, $k$market-research$k$, 5, 1, $k$Growing demand with lower competition.$k$, $k$Others increase risk or delay.$k$, $k$Identify market gaps$k$),
  ($k$MR-S002$k$, $k$market-research$k$, 5, 1, $k$Lower difficulty offers realistic wins.$k$, $k$High KD unrealistic.$k$, $k$Keyword prioritisation$k$),
  ($k$MR-S003$k$, $k$market-research$k$, 10, 1, $k$Highest willingness to pay.$k$, $k$Broad targeting weakens focus.$k$, $k$Segmentation$k$),
  ($k$MR-S004$k$, $k$market-research$k$, 10, 1, $k$Validate with behavioural testing.$k$, $k$Single source insufficient.$k$, $k$Mixed-method research$k$),
  ($k$MR-S005$k$, $k$market-research$k$, 10, 1, $k$Follow customer language.$k$, $k$Others ignore demand.$k$, $k$Trend analysis$k$),
  ($k$MR-S006$k$, $k$market-research$k$, 10, 1, $k$Content likely drives rankings.$k$, $k$Others irrelevant.$k$, $k$Benchmark competitors$k$),
  ($k$MR-S007$k$, $k$market-research$k$, 15, 1, $k$Profitable niches can outperform mass markets.$k$, $k$Volume isn't everything.$k$, $k$Market sizing$k$),
  ($k$MR-S008$k$, $k$market-research$k$, 15, 1, $k$Use additional evidence.$k$, $k$Avoid assumptions.$k$, $k$Persona validation$k$),
  ($k$MR-S009$k$, $k$market-research$k$, 15, 1, $k$Balanced research reduces risk.$k$, $k$Single source creates gaps.$k$, $k$Research planning$k$),
  ($k$MR-S010$k$, $k$market-research$k$, 15, 1, $k$Evidence supports controlled entry.$k$, $k$Others ignore research.$k$, $k$Strategic recommendations$k$),
  ($k$META-S001$k$, $k$meta-ads$k$, 5, 2, $k$Lead campaigns optimize toward lead generation.$k$, $k$Other objectives optimize for different outcomes.$k$, $k$Choose objectives aligned to goals.$k$),
  ($k$META-S002$k$, $k$meta-ads$k$, 5, 1, $k$Separate campaigns improve budget control and reporting.$k$, $k$Other options mix audiences and reduce optimization.$k$, $k$Design scalable structures.$k$),
  ($k$META-S003$k$, $k$meta-ads$k$, 5, 1, $k$Lookalikes leverage existing conversion data.$k$, $k$Other audiences are less qualified.$k$, $k$Audience selection.$k$),
  ($k$META-S004$k$, $k$meta-ads$k$, 5, 1, $k$Budget should follow proven demand.$k$, $k$Equal or random allocation ignores performance.$k$, $k$Budget optimisation.$k$),
  ($k$META-S005$k$, $k$meta-ads$k$, 5, 1, $k$Automatic placements maximize delivery opportunities.$k$, $k$Restricting placements limits learning.$k$, $k$Placement strategy.$k$),
  ($k$META-S006$k$, $k$meta-ads$k$, 10, 0, $k$Poor CTR suggests creative or messaging issues.$k$, $k$More budget won't solve low engagement.$k$, $k$Interpret CTR and CPC.$k$),
  ($k$META-S007$k$, $k$meta-ads$k$, 10, 1, $k$Traffic quality is good but page experience is poor.$k$, $k$Other factors are less supported by the data.$k$, $k$Diagnose funnel issues.$k$),
  ($k$META-S008$k$, $k$meta-ads$k$, 10, 0, $k$Investigate causes before making major changes.$k$, $k$Reactive changes may worsen results.$k$, $k$Systematic optimization.$k$),
  ($k$META-S009$k$, $k$meta-ads$k$, 10, 1, $k$High frequency indicates creative fatigue.$k$, $k$Budget changes won't refresh engagement.$k$, $k$Creative testing.$k$),
  ($k$META-S010$k$, $k$meta-ads$k$, 10, 1, $k$Scale gradually to avoid performance shocks.$k$, $k$Abrupt shifts can reset learning.$k$, $k$Scaling audiences.$k$),
  ($k$META-S011$k$, $k$meta-ads$k$, 15, 0, $k$Gradual scaling protects learning phase.$k$, $k$Aggressive scaling destabilizes delivery.$k$, $k$Scale campaigns safely.$k$),
  ($k$META-S012$k$, $k$meta-ads$k$, 15, 0, $k$Tracking changes often cause attribution gaps.$k$, $k$Other options don't explain missing conversions.$k$, $k$Validate tracking.$k$),
  ($k$META-S013$k$, $k$meta-ads$k$, 15, 1, $k$CAPI complements Pixel and improves signal quality.$k$, $k$Removing tracking reduces optimization quality.$k$, $k$Modern attribution.$k$),
  ($k$META-S014$k$, $k$meta-ads$k$, 15, 0, $k$Understand root causes before changing strategy.$k$, $k$Quick fixes rarely solve systemic issues.$k$, $k$Campaign diagnostics.$k$),
  ($k$META-S015$k$, $k$meta-ads$k$, 20, 1, $k$Investment should follow proven performance while preserving experimentation.$k$, $k$Extreme actions ignore long-term learning.$k$, $k$Strategic performance management.$k$),
  ($k$GA-S001$k$, $k$google-ads$k$, 5, 1, $k$Search captures high-intent users actively looking for courses.$k$, $k$Other campaign types are better suited for awareness or remarketing.$k$, $k$Choose the right campaign type.$k$),
  ($k$GA-S002$k$, $k$google-ads$k$, 5, 2, $k$Tighter match types improve relevance during launch.$k$, $k$Broad match can waste budget without optimization.$k$, $k$Keyword strategy.$k$),
  ($k$GA-S003$k$, $k$google-ads$k$, 5, 1, $k$Negative keywords eliminate irrelevant traffic.$k$, $k$Other actions don't solve poor search intent.$k$, $k$Search query optimization.$k$),
  ($k$GA-S004$k$, $k$google-ads$k$, 10, 0, $k$Quality Score is strongly influenced by relevance.$k$, $k$Other options don't affect Quality Score.$k$, $k$Quality Score analysis.$k$),
  ($k$GA-S005$k$, $k$google-ads$k$, 10, 1, $k$Compelling copy improves CTR before bid changes.$k$, $k$Higher bids won't fix weak messaging.$k$, $k$Ad optimization.$k$),
  ($k$GA-S006$k$, $k$google-ads$k$, 10, 0, $k$Auction Insights reveal competitive pressure.$k$, $k$Other items are unrelated.$k$, $k$Bid strategy analysis.$k$),
  ($k$GA-S007$k$, $k$google-ads$k$, 10, 1, $k$Good traffic but poor landing page performance limits conversions.$k$, $k$Budget isn't the core issue.$k$, $k$Landing page optimization.$k$),
  ($k$GA-S008$k$, $k$google-ads$k$, 10, 1, $k$Business performance matters more than limited reporting.$k$, $k$Other actions reduce effective performance.$k$, $k$Performance Max evaluation.$k$),
  ($k$GA-S009$k$, $k$google-ads$k$, 10, 1, $k$Search term optimization improves relevance.$k$, $k$Other actions don't address wasted spend.$k$, $k$Search term management.$k$),
  ($k$GA-S010$k$, $k$google-ads$k$, 10, 1, $k$Remarketing targets users with existing purchase intent.$k$, $k$Awareness campaigns won't recover abandoned carts.$k$, $k$Remarketing.$k$),
  ($k$GA-S011$k$, $k$google-ads$k$, 15, 1, $k$Gradual scaling preserves performance stability.$k$, $k$Large jumps can destabilize learning.$k$, $k$Campaign scaling.$k$),
  ($k$GA-S012$k$, $k$google-ads$k$, 15, 0, $k$Recent site changes often break tracking.$k$, $k$Other changes don't explain missing conversions.$k$, $k$Tracking validation.$k$),
  ($k$GA-S013$k$, $k$google-ads$k$, 15, 1, $k$Allocate budget based on business performance.$k$, $k$Equal distribution ignores results.$k$, $k$Budget optimization.$k$),
  ($k$GA-S014$k$, $k$google-ads$k$, 15, 0, $k$Systematic diagnosis identifies the real bottleneck.$k$, $k$Reactive changes lack evidence.$k$, $k$Campaign diagnostics.$k$),
  ($k$GA-S015$k$, $k$google-ads$k$, 20, 1, $k$Balance optimization with experimentation.$k$, $k$Extreme decisions ignore long-term account growth.$k$, $k$Strategic account management.$k$),
  ($k$SEO-S001$k$, $k$seo-aeo$k$, 5, 1, $k$Site migrations often break redirects and indexing, causing sudden ranking losses.$k$, $k$Other options do not address the root technical issue.$k$, $k$Identify technical SEO issues.$k$),
  ($k$SEO-S002$k$, $k$seo-aeo$k$, 5, 1, $k$Lower difficulty keywords provide realistic early ranking opportunities.$k$, $k$High difficulty keywords require stronger authority.$k$, $k$Prioritize keywords strategically.$k$),
  ($k$SEO-S003$k$, $k$seo-aeo$k$, 5, 1, $k$A structured content plan fills missing topical coverage.$k$, $k$Shortcuts don't build sustainable authority.$k$, $k$Content planning.$k$),
  ($k$SEO-S004$k$, $k$seo-aeo$k$, 10, 1, $k$Local SEO depends heavily on business profile optimization, reviews and local signals.$k$, $k$Other actions have limited local ranking impact.$k$, $k$Improve local search visibility.$k$),
  ($k$SEO-S005$k$, $k$seo-aeo$k$, 10, 1, $k$User experience metrics influence SEO and conversions.$k$, $k$Other actions won't solve performance issues.$k$, $k$Optimize Core Web Vitals.$k$),
  ($k$SEO-S006$k$, $k$seo-aeo$k$, 10, 1, $k$Relevant, authoritative links build trust and rankings sustainably.$k$, $k$Manipulative tactics risk penalties.$k$, $k$Ethical link building.$k$),
  ($k$SEO-S007$k$, $k$seo-aeo$k$, 10, 1, $k$Structured data helps search engines understand content and enables rich snippets.$k$, $k$Other actions don't improve structured search results.$k$, $k$Use schema effectively.$k$),
  ($k$SEO-S008$k$, $k$seo-aeo$k$, 15, 1, $k$Snippet-friendly formatting improves eligibility.$k$, $k$Paid ads don't affect organic snippets.$k$, $k$Optimize for featured snippets.$k$),
  ($k$SEO-S009$k$, $k$seo-aeo$k$, 15, 1, $k$Answer engines reward clear, authoritative, well-structured information.$k$, $k$Single-factor strategies are less effective.$k$, $k$Optimize for AI-driven search.$k$),
  ($k$SEO-S010$k$, $k$seo-aeo$k$, 15, 1, $k$Redirect planning preserves rankings and user access.$k$, $k$Skipping preparation risks major traffic loss.$k$, $k$Manage SEO migrations.$k$),
  ($k$SEO-S011$k$, $k$seo-aeo$k$, 15, 1, $k$Internal links distribute authority and improve crawlability.$k$, $k$Other actions reduce discoverability.$k$, $k$Strengthen site architecture.$k$),
  ($k$SEO-S012$k$, $k$seo-aeo$k$, 15, 1, $k$Core updates often reward helpful, trustworthy content.$k$, $k$Quick fixes rarely solve quality issues.$k$, $k$Recover from algorithm updates.$k$),
  ($k$SEO-S013$k$, $k$seo-aeo$k$, 15, 1, $k$Refreshing strong content is often faster than creating from scratch.$k$, $k$Deletion wastes existing authority.$k$, $k$Content lifecycle management.$k$),
  ($k$SEO-S014$k$, $k$seo-aeo$k$, 15, 1, $k$Business outcomes matter more than vanity metrics.$k$, $k$Single metrics provide incomplete insights.$k$, $k$Measure SEO performance.$k$),
  ($k$SEO-S015$k$, $k$seo-aeo$k$, 20, 1, $k$A balanced strategy builds durable organic growth across multiple ranking factors.$k$, $k$Single-channel approaches are less resilient.$k$, $k$Develop long-term SEO & AEO strategies.$k$),
  ($k$ANA-S001$k$, $k$analytics$k$, 5, 1, $k$Without conversion tracking, campaign success cannot be measured accurately.$k$, $k$The other options do not establish reliable measurement.$k$, $k$Understand GA4 setup.$k$),
  ($k$ANA-S002$k$, $k$analytics$k$, 5, 1, $k$The issue lies after the visit, not in acquiring traffic.$k$, $k$Other options do not address conversion performance.$k$, $k$Analyze traffic quality vs. conversions.$k$),
  ($k$ANA-S003$k$, $k$analytics$k$, 10, 1, $k$Different platforms use different attribution methodologies.$k$, $k$The other options are unsupported assumptions.$k$, $k$Interpret attribution correctly.$k$),
  ($k$ANA-S004$k$, $k$analytics$k$, 10, 1, $k$The largest loss occurs during checkout.$k$, $k$Other actions ignore the biggest bottleneck.$k$, $k$Diagnose funnel leakage.$k$),
  ($k$ANA-S005$k$, $k$analytics$k$, 10, 1, $k$Budget should follow performance while preserving experimentation.$k$, $k$Extreme decisions reduce learning opportunities.$k$, $k$Use ROI to guide investment.$k$),
  ($k$ANA-S006$k$, $k$analytics$k$, 10, 1, $k$Website updates commonly break tracking tags or events.$k$, $k$Other items don't explain missing conversions.$k$, $k$Troubleshoot analytics implementation.$k$),
  ($k$ANA-S007$k$, $k$analytics$k$, 15, 1, $k$Executives need metrics tied to business performance.$k$, $k$Vanity metrics don't reflect business impact.$k$, $k$Build meaningful dashboards.$k$),
  ($k$ANA-S008$k$, $k$analytics$k$, 15, 1, $k$The largest opportunity is improving first-visit experience and traffic quality.$k$, $k$Other actions don't address the observed behavior.$k$, $k$Analyze audience segments.$k$),
  ($k$ANA-S009$k$, $k$analytics$k$, 15, 1, $k$Balance current performance with long-term growth.$k$, $k$Single-channel dependence increases risk.$k$, $k$Evaluate marketing mix performance.$k$),
  ($k$ANA-S010$k$, $k$analytics$k$, 20, 1, $k$Decision-makers need insights and recommendations rather than raw metrics.$k$, $k$Other options provide incomplete decision support.$k$, $k$Turn analytics into business strategy.$k$),
  ($k$CM-S001$k$, $k$content-marketing$k$, 5, 1, $k$Educational content builds trust, authority and supports both SEO and lead generation.$k$, $k$The other options create limited long-term value.$k$, $k$Develop a customer-first content strategy.$k$),
  ($k$CM-S002$k$, $k$content-marketing$k$, 5, 1, $k$Video combined with supporting articles reaches users effectively and improves discoverability.$k$, $k$Other formats provide less engagement.$k$, $k$Match content format to audience behavior.$k$),
  ($k$CM-S003$k$, $k$content-marketing$k$, 5, 1, $k$A structured calendar improves planning, quality and consistency.$k$, $k$Reactive publishing weakens strategy.$k$, $k$Plan content systematically.$k$),
  ($k$CM-S004$k$, $k$content-marketing$k$, 10, 1, $k$Readable, well-structured content keeps users engaged.$k$, $k$Traffic alone doesn't improve engagement.$k$, $k$Optimize content quality.$k$),
  ($k$CM-S005$k$, $k$content-marketing$k$, 10, 1, $k$Different funnel stages require different content to nurture prospects.$k$, $k$Single-stage content limits conversions.$k$, $k$Map content to the customer journey.$k$),
  ($k$CM-S006$k$, $k$content-marketing$k$, 10, 1, $k$Repurposing extends reach while reducing production effort.$k$, $k$Ignoring successful assets wastes opportunity.$k$, $k$Scale winning content.$k$),
  ($k$CM-S007$k$, $k$content-marketing$k$, 15, 1, $k$Original expertise builds trust and long-term authority.$k$, $k$Generic content rarely differentiates a brand.$k$, $k$Create thought leadership.$k$),
  ($k$CM-S008$k$, $k$content-marketing$k$, 15, 1, $k$Investing more in proven formats while continuing experimentation balances growth and innovation.$k$, $k$Extreme decisions reduce learning.$k$, $k$Optimize using performance data.$k$),
  ($k$CM-S009$k$, $k$content-marketing$k$, 15, 1, $k$Business outcomes provide a complete view of content performance.$k$, $k$Vanity metrics don't demonstrate business value.$k$, $k$Measure content marketing effectively.$k$),
  ($k$CM-S010$k$, $k$content-marketing$k$, 20, 1, $k$Integrated campaigns reinforce messaging across the customer journey and improve overall performance.$k$, $k$Single-channel strategies limit reach and consistency.$k$, $k$Design integrated content marketing campaigns.$k$),
  ($k$MAI-S001$k$, $k$marketing-automation-ai$k$, 5, 1, $k$A welcome sequence engages leads immediately while interest is highest.$k$, $k$Other options are less timely and less personalized.$k$, $k$Build basic lifecycle automation.$k$),
  ($k$MAI-S002$k$, $k$marketing-automation-ai$k$, 5, 1, $k$Behavior-based nurturing delivers relevant messages at the right time.$k$, $k$Manual outreach doesn't scale.$k$, $k$Design nurture journeys.$k$),
  ($k$MAI-S003$k$, $k$marketing-automation-ai$k$, 5, 1, $k$Automated reminders improve attendance while saving staff time.$k$, $k$Promotional messages don't solve the problem.$k$, $k$Automate customer communication.$k$),
  ($k$MAI-S004$k$, $k$marketing-automation-ai$k$, 10, 1, $k$Lead scoring helps sales focus on the most qualified prospects.$k$, $k$Other approaches waste sales effort.$k$, $k$Implement lead qualification.$k$),
  ($k$MAI-S005$k$, $k$marketing-automation-ai$k$, 10, 1, $k$Timely reminders recover purchase intent.$k$, $k$Generic campaigns are less effective.$k$, $k$Recover abandoned carts.$k$),
  ($k$MAI-S006$k$, $k$marketing-automation-ai$k$, 10, 1, $k$AI accelerates creation while human review ensures quality and brand accuracy.$k$, $k$Unreviewed AI can introduce errors.$k$, $k$Use AI responsibly.$k$),
  ($k$MAI-S007$k$, $k$marketing-automation-ai$k$, 10, 1, $k$AI can uncover patterns faster, but results should still be validated.$k$, $k$Manual-only analysis doesn't scale.$k$, $k$Apply AI to customer insights.$k$),
  ($k$MAI-S008$k$, $k$marketing-automation-ai$k$, 15, 1, $k$Automation reduces errors and saves time.$k$, $k$Manual processes don't scale.$k$, $k$Design integrated workflows.$k$),
  ($k$MAI-S009$k$, $k$marketing-automation-ai$k$, 15, 1, $k$AI handles repetitive questions while humans manage complex cases.$k$, $k$A hybrid approach balances efficiency and service quality.$k$, $k$Implement conversational AI.$k$),
  ($k$MAI-S010$k$, $k$marketing-automation-ai$k$, 15, 1, $k$Personalized automation targets users with existing brand awareness.$k$, $k$Retention is often more cost-effective than acquisition.$k$, $k$Build win-back campaigns.$k$),
  ($k$MAI-S011$k$, $k$marketing-automation-ai$k$, 15, 1, $k$Detailed prompts produce more reliable outputs.$k$, $k$Poor prompts create inconsistent results.$k$, $k$Develop prompt engineering skills.$k$),
  ($k$MAI-S012$k$, $k$marketing-automation-ai$k$, 15, 1, $k$Optimization begins with understanding existing performance.$k$, $k$Adding complexity without analysis is ineffective.$k$, $k$Audit automation systems.$k$),
  ($k$MAI-S013$k$, $k$marketing-automation-ai$k$, 15, 1, $k$Responsible governance protects customers and the brand.$k$, $k$Blind automation creates legal and ethical risks.$k$, $k$Apply ethical AI practices.$k$),
  ($k$MAI-S014$k$, $k$marketing-automation-ai$k$, 20, 1, $k$Coordinated journeys improve customer experience across touchpoints.$k$, $k$Isolated channels reduce personalization.$k$, $k$Design omnichannel automation.$k$),
  ($k$MAI-S015$k$, $k$marketing-automation-ai$k$, 20, 1, $k$A phased strategy reduces risk while maximizing long-term adoption.$k$, $k$Extreme approaches are unrealistic and increase organizational risk.$k$, $k$Develop enterprise AI marketing strategy.$k$)
on conflict (question_id) do update set
  track_slug = excluded.track_slug,
  weight = excluded.weight,
  correct_index = excluded.correct_index,
  why_correct = excluded.why_correct,
  why_others_wrong = excluded.why_others_wrong,
  learning_outcome = excluded.learning_outcome;

-- ---------------------------------------------------------------------------
-- 2. Mark which attempts the server graded
-- ---------------------------------------------------------------------------
alter table public.practice_attempts
  add column if not exists server_graded boolean not null default false;

-- ---------------------------------------------------------------------------
-- 3. The only way to record an attempt: submit answers, get graded
--    p_answers is {"<question id>": <chosen option index>, ...} and must
--    answer every question in the track.
-- ---------------------------------------------------------------------------
create or replace function public.submit_practice_attempt(p_track text, p_answers jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec record;
  v_total int := 0;
  v_correct int := 0;
  v_earned int := 0;
  v_max int := 0;
  v_percent int;
  v_review jsonb := '{}'::jsonb;
  v_selected int;
begin
  if uid is null then
    raise exception 'You are not signed in.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Send your answers as an object of question id to option.';
  end if;

  -- One attempt at a time per track: a script can't hammer the grader to
  -- probe for the answers, and a real attempt takes minutes anyway.
  if exists (select 1 from public.practice_attempts
              where profile_id = uid and track_slug = p_track
                and attempted_at > now() - interval '45 seconds') then
    raise exception 'That was quick — wait a moment before another attempt on this track.';
  end if;

  for rec in
    select k.question_id, k.weight, k.correct_index, k.why_correct, k.why_others_wrong, k.learning_outcome
      from public.decision_lab_answer_key k
     where k.track_slug = p_track
     order by k.question_id
  loop
    v_total := v_total + 1;
    v_max := v_max + rec.weight;

    if not (p_answers ? rec.question_id) then
      raise exception 'Answer every question before submitting.';
    end if;
    begin
      v_selected := (p_answers ->> rec.question_id)::int;
    exception when others then
      raise exception 'Answers must be option numbers.';
    end;

    if v_selected = rec.correct_index then
      v_correct := v_correct + 1;
      v_earned := v_earned + rec.weight;
    end if;

    v_review := v_review || jsonb_build_object(
      rec.question_id,
      jsonb_build_object(
        'correctIndex', rec.correct_index,
        'whyCorrect', rec.why_correct,
        'whyOthersWrong', rec.why_others_wrong,
        'learningOutcome', rec.learning_outcome
      )
    );
  end loop;

  if v_total = 0 then
    raise exception 'Unknown track.';
  end if;

  v_percent := round((v_earned::numeric / v_max) * 100);

  insert into public.practice_attempts
    (profile_id, track_slug, correct, total, earned_weight, max_weight, percent, server_graded)
  values (uid, p_track, v_correct, v_total, v_earned, v_max, v_percent, true);

  return json_build_object(
    'grade', json_build_object(
      'correct', v_correct, 'total', v_total,
      'earnedWeight', v_earned, 'maxWeight', v_max, 'percent', v_percent
    ),
    'review', v_review
  );
end;
$$;

revoke execute on function public.submit_practice_attempt(text, jsonb) from public, anon;
grant execute on function public.submit_practice_attempt(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Close the direct-write hole
-- ---------------------------------------------------------------------------
drop policy if exists pa_insert_own on public.practice_attempts;

-- The unused timed-test table had the same open door (test_attempts, written
-- by the browser, no UI writes it any more). Close it too.
drop policy if exists ta_insert_own on public.test_attempts;

-- ---------------------------------------------------------------------------
-- 5. A track's score = best of the last 3 attempts.
--    `attempts` stays the all-time count.
-- ---------------------------------------------------------------------------
create or replace view public.practice_best_scores with (security_invoker = 'on') as
  select profile_id,
         track_slug,
         max(percent) as percent,
         max(all_attempts) as attempts,
         max(attempted_at) as last_attempt_at
    from (
      select pa.*,
             row_number() over (partition by profile_id, track_slug order by attempted_at desc) as rn,
             count(*)     over (partition by profile_id, track_slug) as all_attempts
        from public.practice_attempts pa
    ) recent
   where rn <= 3
   group by profile_id, track_slug;

-- ---------------------------------------------------------------------------
-- Check it (as a signed-in learner, in the app), or as admin:
--   select count(*) from public.decision_lab_answer_key;            -- 100
--   select track_slug, count(*) from public.decision_lab_answer_key group by 1;
--   select server_graded, count(*) from public.practice_attempts group by 1;
-- ---------------------------------------------------------------------------

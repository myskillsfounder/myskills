# Agentic AI: research brief

Programme: Agentic AI (professional, new). Brief: "teach students how to work better with AI".
Researched 2026-11-21 by the Assessment Agent. This field changes monthly: every plan limit, offer and feature below must be re-checked on the vendor's own page on the day a module is written (playbook rules 8 and 9).

## 1. What employers and internship hosts want

- **Checking AI output is the top-ranked skill in India.** In Microsoft's Work Trend Index 2026 (20,000 AI users, ten markets), Indian respondents ranked "quality control of AI output" as the top skill (63%, against 50% globally), with critical thinking second (59% against 46%). 87% said they stay responsible for the thinking and treat AI output as a starting point. 32% of Indian AI users are "Frontier Professionals" who redesign work around agents (global average 16%). [Microsoft, 3 Sep 2026](https://news.microsoft.com/source/asia/2026/09/03/indias-ai-advantage-is-human-microsoft-work-trend-index-2026-finds-india-among-the-worlds-leading-frontier-workforces/)
- **Large employers already use agents at scale.** The same release says Infosys, TCS, Wipro and LTM together took 400,000+ Microsoft 365 Copilot seats in under six months, and Wipro reports 29,000+ agents built by end users. These are company-reported figures. [Microsoft, same](https://news.microsoft.com/source/asia/2026/09/03/indias-ai-advantage-is-human-microsoft-work-trend-index-2026-finds-india-among-the-worlds-leading-frontier-workforces/). In 2025, 93% of Indian leaders planned to use agents within 12 to 18 months. [Microsoft WTI 2025 India](https://news.microsoft.com/source/asia/2025/08/20/indias-workforce-goes-ai-first-as-frontier-firms-lead-the-transformation-microsoft-work-trend-index-2025/)
- **AI skills now appear in ordinary job descriptions.** Naukri's World AI Day 2026 report says AI skills appear in 15.4% of tech job descriptions, up from 0.9% in 2020 (secondary report; Naukri's page returned 403 to me). [Free Press Journal](https://freepressjournal.in/business/ai-skills-appear-in-154-tech-jobs-as-demand-surges-17-fold-report). AI/ML roles led white-collar hiring growth through mid-2026. [Naukri JobSpeak June 2026](https://www.naukri.com/blog/naukri-jobspeak-white-collar-hiring-grows-6-in-june-2026-ai-ml-and-fresher-hiring-lead-the-charge/)
- **Freshers are judged on proof of work.** TeamLease EdTech (H1 2026) says fresher employability is increasingly tied to internships, projects and portfolios, and that AI and automation tools now matter outside core tech roles. [Careers360](https://news.careers360.com/ai-data-digital-skills-fresher-hiring-degree-screening-proof-of-work-adaptability-teamlease-edtech-report-india)
- **Not confirmed:** I found no Internshala or employer survey listing specific agent skills asked of interns. The India Skills Report 2026 figures on AI-tool use differ between summaries (one says over 90% of employees, another over 40% of the IT and gig workforce), and I could not open the primary PDF. Don't quote either.

**What this means for the course:** the employer ask is not "prompt engineering" as a trick. It is briefing well, checking output, owning the result, and handing multi-step work to agents safely. A portfolio piece (the project) matters more than a certificate.

## 2. What agentic AI is (vendor-neutral, precise)

- **Workflow vs agent.** Anthropic's widely cited definition: workflows are "systems where LLMs and tools are orchestrated through predefined code paths"; agents are "systems where LLMs dynamically direct their own processes and tool usage". The building block is an "augmented LLM" with retrieval, tools and memory. It recommends the simplest solution that works, and agents only for open-ended tasks where steps can't be predicted. Risks named: higher cost and latency, compounding errors, the need for sandboxing, stopping conditions and human checkpoints. [Anthropic, Building effective agents, Dec 2024](https://www.anthropic.com/engineering/building-effective-agents)
- **Four design patterns** taught by DeepLearning.AI: reflection (the model critiques and revises its own work), tool use, planning (break a task into steps and adapt), and multi-agent collaboration, plus evaluation (evals) and error analysis. [DeepLearning.AI Agentic AI](https://www.deeplearning.ai/courses/agentic-ai)
- **Tools and integrations are standardising.** The Model Context Protocol (MCP, from Anthropic, a standard way for agents to reach tools and data) and AGENTS.md (from OpenAI, a file that tells coding agents how a project works) moved to the Linux Foundation's Agentic AI Foundation on 9 Dec 2025. [Linux Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- **Consumer agents are real but change fast.** OpenAI launched ChatGPT Work on 9 July 2026: an agent that breaks projects into steps, uses apps, files and a built-in browser, runs scheduled tasks, and asks for approval before important actions. On web and mobile it went to paid plans; on the Windows and Mac desktop app OpenAI says Chat, Work and Codex are on every plan, including Free. [OpenAI](https://openai.com/index/chatgpt-for-your-most-ambitious-work). The earlier "ChatGPT agent" is now retired: "ChatGPT agent is no longer available" (paid plans only while it existed). [OpenAI Help](https://help.openai.com/en/articles/11752874). **Teach the idea, not a product name**: a feature named in a module can be gone within a year.
- **Computer and browser use: verified limits.** Anthropic's computer-use docs say the model "sometimes assumes actions succeeded without checking", finds dropdowns and scrollbars hard, and that instructions on web pages or in images "can override yours". They advise a separate machine or container, no logins or sensitive data, and human confirmation of consequential actions (payments, accepting terms). [Claude computer use docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool)
- **Memory and context** are limited and vary by plan: Gemini's free tier has a 32k-token context window [Google](https://support.google.com/gemini/answer/16275805?hl=en); ChatGPT's free memory is "limited" [ChatGPT pricing](https://chatgpt.com/pricing); Claude added "compaction" (auto-summarising older parts of a long chat) to its free plan in Feb 2026 [MacRumors](https://www.macrumors.com/2026/02/11/anthropic-claude-more-free-features/). Lesson for students: an agent forgets or summarises; put key facts in the brief.
- **Hype to correct:** agents don't "think like employees", don't reliably finish long tasks unattended, and don't remove the need to check. Productivity gains are not guaranteed: in Anthropic's controlled trial, the AI group was not significantly faster (about 23 v 25 minutes, p=0.39). [Anthropic, Jan 2026](https://www.anthropic.com/research/AI-assistance-coding-skills)

## 3. Free tools a student can use (phone or basic laptop)

All limits change often; check on the day.

| Tool | What the free tier allows (as found) | Source |
|---|---|---|
| Google Gemini app | "Standard limits" that refresh every 5 hours up to a weekly cap; 32k context; Deep Research (may be unavailable at peak), Canvas, connected apps, screen automation, Tasks. Agent mode on free: **not confirmed**. | [Google Help](https://support.google.com/gemini/answer/16275805?hl=en) |
| Claude (claude.ai, app) | Since 11 Feb 2026: file creation (Word, Excel, PowerPoint, PDF), connectors (e.g. Slack, Notion, Canva, Zapier), skills, compaction; same usage cap. Claude in Chrome (browser agent) is **paid only**. | [MacRumors](https://www.macrumors.com/2026/02/11/anthropic-claude-more-free-features/), [Anthropic](https://claude.com/blog/claude-in-chrome-generally-available) |
| ChatGPT | Free: web search, limited files, images, memory; scheduled tasks not on Free. Desktop app: Work and Codex on Free (usage-based). | [ChatGPT pricing](https://chatgpt.com/pricing), [OpenAI](https://openai.com/index/chatgpt-for-your-most-ambitious-work) |
| Google Opal | No-code AI "mini-app" builder; free with a Google account; in India since Oct 2025, 160+ countries since Nov 2025. 2026 status not re-confirmed. | [Google blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/opal-expansion-160/) |
| Zapier | Free: 100 tasks a month, two-step Zaps; tasks also count MCP actions. | [Zapier pricing](https://zapier.com/pricing), [Zapier help](https://help.zapier.com/hc/en-us/articles/32337438839565) |
| Make | Free: 1,000 credits a month (one secondary source says "operations"). | [Zapier comparison citing Make](https://dev.to/trackstack/zapier-free-plan-in-2026-what-100-tasks-actually-buy-you-3h8k) (secondary; check make.com) |
| n8n | Self-hosted Community edition free under the Sustainable Use Licence (not open source; laptop or server needed). Cloud trial terms not confirmed. | [n8n licence FAQ](https://docs.n8n.io/n8n-community-license/community-license/license-faq) |
| Gemini CLI (coding agent) | Personal Google account: 1,000 requests a day, 60 a minute. Laptop and terminal needed. | [Gemini CLI quotas](https://geminicli.com/docs/resources/quota-and-pricing) |
| GitHub Copilot Free | 2,000 code completions a month plus an AI-credit allowance (older docs said 50 chat requests). | [GitHub Docs](https://docs.github.com/en/copilot/get-started/plans) |

**India promotions (time-limited, don't build a task on them):** free ChatGPT Go for 12 months from 4 Nov 2025 [TechCrunch](https://techcrunch.com/2025/10/27/openai-offers-free-chatgpt-go-for-one-year-to-all-users-in-india/); Google AI Pro free for 18 months for eligible Jio unlimited 5G users [Deccan Herald](https://www.deccanherald.com/technology/reliance-teams-up-with-google-to-offer-18-month-google-ai-pro-plan-for-free-to-jio-users-3780521); Perplexity Pro free for a year for Airtel users [Digit](https://www.digit.in/news/apps/chatgpt-gemini-and-perplexity-pro-paid-subscriptions-are-now-free-in-india-heres-how-to-get-them.html). Current status of all three is unconfirmed; the ChatGPT Go year ends for early joiners this month.

**Not checked:** Microsoft Copilot (free app), Meta AI in WhatsApp, Perplexity's free tier and Comet browser. Name them only after checking.

**Design consequence:** phone-first tasks should use a chat assistant with web search and file upload (Gemini, Claude, ChatGPT, any one). Agent and automation tasks need a laptop or a free web builder (Opal, Zapier). Always give a route that works on any of three vendors.

## 4. Risks and responsibility

**Hallucination.** OpenAI's Sept 2025 paper argues models hallucinate partly because training and evaluation reward guessing over saying "I don't know". [OpenAI](https://openai.com/index/why-language-models-hallucinate/). Indian courts have now met fake AI citations: the Bombay High Court imposed ₹50,000 costs on a litigant for citing an AI-generated judgment that didn't exist [Free Press Journal](https://www.freepressjournal.in/mumbai/bombay-hc-fines-litigant-50000-for-citing-fake-ai-generated-judgment-in-written-submissions); the Supreme Court called a trial court's reliance on fake AI judgments a matter of "institutional concern" [Business Standard](https://www.business-standard.com/india-news/sc-flags-serious-concern-over-trial-court-citing-ai-generated-cases-126030201055_1.html). How to verify: open every cited source, check the claim is in it, check numbers against the original, ask for sources you can open, cross-check high-stakes facts in a second independent source.

**Prompt injection and untrusted content.** OWASP LLM01:2025 defines direct injection (a user's own prompt) and indirect injection (instructions hidden in a web page or file the model reads). Mitigations: least privilege, human approval for high-risk actions, keep untrusted content separate; "no method is fully foolproof". [OWASP](https://genai.owasp.org/llmrisk/llm01-prompt-injection/). OpenAI (Dec 2025): prompt injection "is unlikely to ever be fully 'solved'"; it advises logged-out mode where possible and careful review of confirmation requests. [TechCrunch](https://techcrunch.com/2025/12/22/openai-says-ai-browsers-may-always-be-vulnerable-to-prompt-injection-attacks/)

**Privacy: DPDP Act 2023 and DPDP Rules 2025 (state exactly).**
- The Act does not apply to personal data processed by an individual for a personal or domestic purpose (s. 3(c)(i)), or to data the person made public themselves or that someone was legally required to publish (s. 3(c)(ii)). [India Code](https://www.indiacode.nic.in/bitstream/123456789/22037/2/a2023-22.pdf)
- A business (data fiduciary) may process personal data with consent or for certain legitimate uses (s. 4, s. 7). Penalties go up to ₹250 crore (Schedule). [India Code](https://www.indiacode.nic.in/bitstream/123456789/22037/2/a2023-22.pdf)
- Rules notified 13 Nov 2025 (gazette; PIB says 14 Nov). Phase 1 (Board, definitions) immediate; Phase 2, **13 Nov 2026**, consent-manager registration; Phase 3, **13 May 2027**, the substantive duties: itemised notice, consent, children's verifiable parental consent, rights, breach notice (to the Board without delay, details within 72 hours), and one-year log retention. [AZB](https://www.azbpartners.com/bank/update-indias-digital-personal-data-protection-framework-comes-into-effect/)
- **Uncertain (rule 9):** MeitY consulted in early 2026 on shortening the timeline, and one source reports a "Removal of Difficulties Order 2026". I could not confirm either on MeitY's site. Write "most duties are due to apply from 13 May 2027" and re-check before publishing. [Chambers](https://chambers.com/articles/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs), [India Briefing](https://www.india-briefing.com/news/dpdp-removal-of-difficulties-order-2026-consent-data-audit-47274.html/)
- **What to teach:** an intern who pastes a client's customer list into a free AI tool acts for the business, not for a personal purpose, so the exemption doesn't cover it. Use the employer's approved tool, remove names and numbers, share the minimum.

**IT Rules: AI-generated content labelling.** The IT (Intermediary Guidelines and Digital Media Ethics Code) Amendment Rules, 2026 were notified 10 Feb 2026 (one firm says 16 Feb) and in force from 20 Feb 2026. "Synthetically generated information" is audio, visual or audio-visual content made or altered by computer to appear real; good-faith routine editing, accessibility, translation and similar uses are excluded, and plain text is outside the definition. Platforms that offer AI generation must label such content prominently (visual labels; a spoken disclosure at the start of audio). Significant social media platforms must ask users to declare whether content is synthetic and verify it with technical measures. Takedown times: 3 hours on a court or government order (was 36), 2 hours for non-consensual intimate or morphed images (was 24). [Khaitan & Co](https://www.khaitanco.com/thought-leadership/MeitY-notifies-the-IT-Amendment-Rules-2026), [Bar & Bench](https://www.barandbench.com/news/law-policy/centre-amends-it-rules-to-regulate-ai-generated-content-takedown-timelines-reduced). The duties fall on platforms; a student's duty is to declare honestly when the platform asks. I could not read the gazette text.

**Academic integrity and disclosure.** There is no UGC rule on student AI use that I could confirm; UGC's 2018 plagiarism regulations still apply, and universities set their own rules. IIT Delhi (May 2025) requires AI-assisted work to be "fully disclosed". [Business Standard](https://www.business-standard.com/education/news/iit-delhi-ai-assisted-work-disclosure-guidelines-2025-125052801555_1.html), [Careers360](https://news.careers360.com/no-ugc-rules-ai-chatbot-chatgpt-nlsiu-bangalore-delhi-university-du-hnlu-amu-shiv-nadar-add-viva-voce-oral-test-policy-assignment). Teach: follow your college's and employer's rule, and disclose what AI did.

**Over-reliance and deskilling.** Microsoft and CMU (CHI 2025, 319 knowledge workers): more confidence in AI went with less critical thinking; more self-confidence with more. [Microsoft Research](https://www.microsoft.com/en-us/research/?p=1135061). Anthropic's trial (52 mostly junior engineers): the AI group scored about 50% on a quiz against 67% for hand-coders; learners who asked follow-up and conceptual questions kept their learning (65%+), full delegation scored under 40%. [Anthropic](https://www.anthropic.com/research/AI-assistance-coding-skills)

**Copyright.** On 24 July 2026 the Delhi High Court refused ANI's interim injunction against OpenAI, holding prima facie that training use fell within fair dealing; the main suit is pending. [LiveLaw](https://www.livelaw.in/high-court/delhi-high-court/delhi-high-court-rejects-ani-copyright-suit-open-ai-chatgpt-542736). DPIIT's working paper (8 Dec 2025) proposed a mandatory blanket licence with royalties for creators; it is a proposal, not law. [Bar & Bench](https://www.barandbench.com/amp/story/news/law-policy/ai-developers-should-get-access-to-copyrighted-content-subject-to-payment-of-fee-central-government-panel). Teach the stable part: don't pass off others' work, check outputs that copy text or logos, and don't promise a client they "own" AI output; Indian law on AI authorship is unsettled.

## 5. Beginner mistakes and misconceptions (wrong options)

1. Treating a fluent, confident answer as checked; trusting a citation without opening it (sources above).
2. One-line briefs with no context, audience, constraints or example, then blaming the tool.
3. Asking for the whole job in one prompt instead of steps with checks between them (Anthropic's prompt chaining).
4. Assuming the agent remembers earlier chats or the whole long file (context limits, compaction).
5. Letting an agent click "pay", "send" or "accept terms" without a human check (computer-use docs).
6. Obeying, or not noticing, instructions inside a web page, email or PDF the agent read (indirect injection).
7. Pasting customer or classmate personal data into a free tool because "it's only for work" (DPDP s. 3).
8. Thinking the DPDP Act forbids all use of personal data (it allows consent and legitimate uses), or that all its duties already apply (most from 13 May 2027).
9. Believing AI text must carry a government label (the 2026 rules cover audio-visual content and platform duties).
10. Building a full agent when a simple checklist, template or two-step automation would do (Anthropic: simplest solution first).
11. Delegating the learning itself: copying code or answers without asking why (Anthropic trial).
12. Using AI where a mistake is costly and unverifiable (legal, medical, money), or where the rule says no.
13. Assuming "the AI checked itself" is enough: reflection helps but is not independent verification.

## 6. How strong courses teach this, and gaps MySkills can fill

- **Anthropic AI Fluency: Framework & Foundations** (free, about 3 to 4 hours, CC BY-NC-SA, with Dakan and Feller): the 4Ds, Delegation, Description, Discernment, Diligence; three modes, automation, augmentation and agency; final assessment and certificate. [Anthropic](https://www.anthropic.com/ai-fluency), [Coursera](https://www.coursera.org/learn/ai-fluency-framework-foundations)
- **Google AI Essentials** (paid on Coursera, financial aid available; about 4 to 10 hours): intro, productivity, prompting, responsible use, staying current. [Coursera](https://www.coursera.org/learn/google-ai-essentials)
- **DeepLearning.AI Agentic AI** (Andrew Ng; intermediate, about 10 hours, Python): reflection, tool use, planning, multi-agent, evals; graded coding assignments. [DeepLearning.AI](https://www.deeplearning.ai/courses/agentic-ai)
- **Hugging Face Agents Course** (free): developer-focused; certificate needs a final agent scoring 30%+ on a benchmark. [Hugging Face](https://huggingface.co/learn/agents-course/unit0/introduction)
- **OpenAI Academy / Certifications**: AI Foundations taught inside ChatGPT; Indian partners announced Feb 2026 (IIM Ahmedabad, Manipal). [TechCrunch](https://techcrunch.com/2026/02/18/openai-pushes-into-higher-education-as-india-seeks-to-scale-ai-skills/)
- **India: MSDE SOAR**, three 15-hour modules for school students (secondary sources only). [Vikaspedia](https://en.vikaspedia.in/viewcontent/education/artificial-intelligence/skilling-for-ai-readiness)

**Gaps to fill:** (1) The non-coding courses are mostly video and multiple choice; few make the learner hand in real work they checked. (2) Each lab course leans on its own product. (3) None covers DPDP, the 2026 IT Rules or Indian court cases. (4) Verification is a principle, rarely a graded practice step with a trap planted. (5) Agent safety (approvals, injection) sits only in developer courses. (6) None is phone-first or written for second-language readers. MySkills can lead on graded verification, vendor-neutral tasks, Indian law and a mentor-checked portfolio project.

## 7. Suggested skill map (8 skills)

1. `ai-foundations`: explain what assistants and agents can and can't do, and pick the right kind for a task.
2. `briefing`: write briefs with goal, context, audience, constraints, examples and output format.
3. `task-breakdown`: split work into steps with checkpoints and decide which steps to delegate.
4. `verification`: check facts, sources, numbers and logic before using AI output.
5. `tools-and-agents`: use search, files, connectors, research and agent modes, with approvals.
6. `automation`: build a simple no-code workflow with a trigger, steps and a human check.
7. `safe-use`: protect personal and confidential data and resist prompt injection.
8. `integrity-judgement`: disclose AI use, respect copyright and labels, keep your own skills, know when not to use AI.

## 8. Suggested modules (11), with honest hours

| # | Module | Skill | Level | Min |
|---|---|---|---|---|
| 1 | Assistants, agents and workflows: what they are | ai-foundations | Foundation | 75 |
| 2 | Briefing an AI well | briefing | Foundation | 90 |
| 3 | Checking AI output (planted errors to find) | verification | Foundation | 90 |
| 4 | Privacy and confidential data at work (DPDP) | safe-use | Foundation | 75 |
| 5 | Deciding what to hand to AI, and when not to | integrity-judgement | Foundation | 75 |
| 6 | Breaking work into steps and delegating them | task-breakdown | Intermediate | 90 |
| 7 | Research with AI: deep research and sources | verification | Intermediate | 90 |
| 8 | Files, connectors and tools | tools-and-agents | Intermediate | 90 |
| 9 | Honest work: disclosure, copyright, AI labels, keeping your skills | integrity-judgement | Intermediate | 75 |
| 10 | Agents that act: approvals and prompt injection | tools-and-agents / safe-use | Advanced | 100 |
| 11 | Build a no-code automation with a human check | automation | Advanced | 120 |

Modules: 1,070 min (about 18 h). Project with mentor (an AI-assisted workflow for a real small organisation, with a brief, a step plan, a verification log, a privacy check and a disclosure note): about 8 h. Final test: about 1 h. **Total about 27 hours**; level: beginner. Every final question should name its skill; foundation modules 1 to 5 train five skills, which need at least 2 final questions each (rule 13).

## Could not confirm

Gazette texts of the DPDP Rules and the 2026 IT Rules amendment (read via law-firm summaries); any 2026 change to DPDP dates; Gemini agent mode on free; current status of the India free-plan promotions; Make's and n8n Cloud's current free terms; Microsoft Copilot, Meta AI and Perplexity free tiers; any UGC rule on student AI use; Naukri's primary report.

## Sources

- Microsoft WTI 2026 India: https://news.microsoft.com/source/asia/2026/09/03/indias-ai-advantage-is-human-microsoft-work-trend-index-2026-finds-india-among-the-worlds-leading-frontier-workforces/
- Microsoft WTI 2025 India: https://news.microsoft.com/source/asia/2025/08/20/indias-workforce-goes-ai-first-as-frontier-firms-lead-the-transformation-microsoft-work-trend-index-2025/
- Naukri AI skills (secondary): https://freepressjournal.in/business/ai-skills-appear-in-154-tech-jobs-as-demand-surges-17-fold-report
- Naukri JobSpeak June 2026: https://www.naukri.com/blog/naukri-jobspeak-white-collar-hiring-grows-6-in-june-2026-ai-ml-and-fresher-hiring-lead-the-charge/
- TeamLease EdTech H1 2026: https://news.careers360.com/ai-data-digital-skills-fresher-hiring-degree-screening-proof-of-work-adaptability-teamlease-edtech-report-india
- Anthropic, Building effective agents: https://www.anthropic.com/engineering/building-effective-agents
- DeepLearning.AI Agentic AI: https://www.deeplearning.ai/courses/agentic-ai
- Linux Foundation AAIF: https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation
- OpenAI, ChatGPT Work: https://openai.com/index/chatgpt-for-your-most-ambitious-work
- OpenAI Help, ChatGPT agent: https://help.openai.com/en/articles/11752874
- Claude computer use docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool
- Gemini limits: https://support.google.com/gemini/answer/16275805?hl=en
- ChatGPT pricing: https://chatgpt.com/pricing
- Claude free features: https://www.macrumors.com/2026/02/11/anthropic-claude-more-free-features/
- Claude in Chrome: https://claude.com/blog/claude-in-chrome-generally-available
- Google Opal: https://blog.google/innovation-and-ai/models-and-research/google-labs/opal-expansion-160/
- Zapier pricing: https://zapier.com/pricing ; help: https://help.zapier.com/hc/en-us/articles/32337438839565
- Make (secondary): https://dev.to/trackstack/zapier-free-plan-in-2026-what-100-tasks-actually-buy-you-3h8k
- n8n licence FAQ: https://docs.n8n.io/n8n-community-license/community-license/license-faq
- Gemini CLI quotas: https://geminicli.com/docs/resources/quota-and-pricing
- GitHub Copilot plans: https://docs.github.com/en/copilot/get-started/plans
- ChatGPT Go India: https://techcrunch.com/2025/10/27/openai-offers-free-chatgpt-go-for-one-year-to-all-users-in-india/
- Jio Google AI Pro: https://www.deccanherald.com/technology/reliance-teams-up-with-google-to-offer-18-month-google-ai-pro-plan-for-free-to-jio-users-3780521
- Airtel Perplexity: https://www.digit.in/news/apps/chatgpt-gemini-and-perplexity-pro-paid-subscriptions-are-now-free-in-india-heres-how-to-get-them.html
- OpenAI, Why language models hallucinate: https://openai.com/index/why-language-models-hallucinate/
- Bombay HC ₹50,000 costs: https://www.freepressjournal.in/mumbai/bombay-hc-fines-litigant-50000-for-citing-fake-ai-generated-judgment-in-written-submissions
- Supreme Court on fake AI judgments: https://www.business-standard.com/india-news/sc-flags-serious-concern-over-trial-court-citing-ai-generated-cases-126030201055_1.html
- OWASP LLM01:2025: https://genai.owasp.org/llmrisk/llm01-prompt-injection/
- OpenAI on prompt injection (TechCrunch): https://techcrunch.com/2025/12/22/openai-says-ai-browsers-may-always-be-vulnerable-to-prompt-injection-attacks/
- DPDP Act 2023 (India Code): https://www.indiacode.nic.in/bitstream/123456789/22037/2/a2023-22.pdf
- DPDP Rules phases (AZB): https://www.azbpartners.com/bank/update-indias-digital-personal-data-protection-framework-comes-into-effect/
- DPDP timeline proposal (Chambers): https://chambers.com/articles/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs
- DPDP Removal of Difficulties Order (India Briefing): https://www.india-briefing.com/news/dpdp-removal-of-difficulties-order-2026-consent-data-audit-47274.html/
- IT Amendment Rules 2026 (Khaitan): https://www.khaitanco.com/thought-leadership/MeitY-notifies-the-IT-Amendment-Rules-2026
- IT Amendment Rules 2026 (Bar & Bench): https://www.barandbench.com/news/law-policy/centre-amends-it-rules-to-regulate-ai-generated-content-takedown-timelines-reduced
- IIT Delhi disclosure: https://www.business-standard.com/education/news/iit-delhi-ai-assisted-work-disclosure-guidelines-2025-125052801555_1.html
- No UGC framework (Careers360): https://news.careers360.com/no-ugc-rules-ai-chatbot-chatgpt-nlsiu-bangalore-delhi-university-du-hnlu-amu-shiv-nadar-add-viva-voce-oral-test-policy-assignment
- Microsoft/CMU critical thinking: https://www.microsoft.com/en-us/research/?p=1135061
- Anthropic, AI assistance and coding skills: https://www.anthropic.com/research/AI-assistance-coding-skills
- ANI v OpenAI (LiveLaw): https://www.livelaw.in/high-court/delhi-high-court/delhi-high-court-rejects-ani-copyright-suit-open-ai-chatgpt-542736
- DPIIT working paper (Bar & Bench): https://www.barandbench.com/amp/story/news/law-policy/ai-developers-should-get-access-to-copyrighted-content-subject-to-payment-of-fee-central-government-panel
- Anthropic AI Fluency: https://www.anthropic.com/ai-fluency ; Coursera: https://www.coursera.org/learn/ai-fluency-framework-foundations
- Google AI Essentials: https://www.coursera.org/learn/google-ai-essentials
- Hugging Face Agents Course: https://huggingface.co/learn/agents-course/unit0/introduction
- OpenAI India higher education: https://techcrunch.com/2026/02/18/openai-pushes-into-higher-education-as-india-seeks-to-scale-ai-skills/
- MSDE SOAR: https://en.vikaspedia.in/viewcontent/education/artificial-intelligence/skilling-for-ai-readiness

# Research brief: AI-Powered Entrepreneurship

Assessment Agent, 2026-10-26. For `ai-powered-entrepreneurship.json` (not built-in, professional).

**Scope (Paul, revised 2026-10-26):** 7 modules, about 9 hours, for first-time student founders in India, from idea to first paying customers. The modules cover the core business functions, with AI help at each step. Legal and compliance (GST, Udyam, DPIIT, registration) is out of scope. At most one line should say it comes in a later version.

**Settle first:** the house style asks for 8 to 12 modules. Paul's 7 is deliberate, so record it as his choice if `check.mjs` flags it.

## 1. Comparable programmes
- **YC Startup School** is free and takes about 7 weeks at 1 to 2 hours a week. It covers talking to users, planning an MVP, and getting users and growing [startupschool.org](https://startupschool.org/). No lesson on pricing was found.
- **Startup India Learning Program** is free and runs for 4 weeks. It covers idea validation, finance and legal, and pitching and funding [Startup India](https://www.startupindia.gov.in/content/sih/en/learning-and-development.html).
- **The gap:** neither demands real-customer evidence, covers student teams and networks, or is AI-first.

## 2. Evidence standards for validation (Module 1 and the project)
- **The Mom Test** [summary](https://mtlynch.io/book-reports/the-mom-test/):
  - Ask about specific past behaviour, not opinions of your idea.
  - Compliments are "the fool's gold of customer learning".
  - Fluff ("I would…") and feature requests are weak data.
  - A good meeting ends in a **commitment** of time (a next meeting, a trial), reputation (an introduction) or money (a pre-order or deposit).
  - If ten people answer completely differently, the segment is too broad.
- **AI "synthetic users" are not evidence.** NN/g found them too shallow: they praised every concept, while real users raised doubts. Use them only for desk research and hypotheses [NN/g, 2024-06-21](https://www.nngroup.com/articles/synthetic-users/).
- **The Sean Ellis "40% very disappointed" test** needs existing users. It is a heuristic, with false positives early [Learning Loop](https://learningloop.io/plays/product-market-fit-survey). Treat it as a later signal only.
- **Evidence ladder for the rubric** (my synthesis): compliments, then specific past spending of time or money on the problem, then time or reputation commitments, then money (a pre-order or first payment).

## 3. Common first-founder mistakes (good wrong options)
- **Why ventures fail:** in CB Insights' post-mortems, "no market need" and "ran out of cash" lead. The percentages vary by edition: 42% and 29% in 2017, and 35% and 38% later [ACA](https://angelcapitalassociation.org/data/Secure/Leadership%20Workshop%20Library/2017-leadership-workshop/20CausesofFailureScorecard.pdf?rev=EE89), [SmartCompany](https://www.smartcompany.com.au/startupsmart/analysis/startups-fail-founders-capital/).
- **Mistakes to use:** pitching instead of asking; friends' praise as validation; building first; "all students" as the segment; an AI market size taken as fact; cost-plus guesswork pricing; the budget spent on ads before anyone pays; handshake equity with no vesting.

## 4. AI at each stage, responsibly
- **Free tools first:** the free tiers of ChatGPT, Gemini and Claude cover research, interview scripts, note summaries, copy and pricing scenarios.
- **AI app builders' free tiers are small and change often.** Lovable gives about 5 credits a day, and Bolt and v0 have daily caps (secondary, approximate) [Dyad](https://www.dyad.sh/blog/free-ai-app-builders-compared). Teach the method (landing page, Google Form, WhatsApp catalogue, a concierge MVP) plus at most one builder. Never test credit counts.
- **Rules to teach:**
  - Check every AI figure against a source you can open.
  - Never present AI personas as customer evidence.
  - Get consent before putting interviewees' details into AI tools. The DPDP Rules were notified in November 2025, with main duties from about May 2027 [EY](https://www.ey.com/en_in/insights/cybersecurity/transforming-data-privacy-digital-personal-data-protection-rules-2025).
  - Label AI-made media honestly. Since 20 February 2026 the IT Rules require *platforms* to label synthetic content [Hogan Lovells](https://www.hoganlovells.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content).
- I found no reliable data on how Indian founders use AI, so don't quote adoption figures.

## 5. Sales: payments and channels (dated)
- **The UPI merchant fee (MDR) was due on 15 October 2026 but has been postponed** (corrected in review round 1, 2026-10-26). NPCI's FAQ of 15 September 2026 [NPCI](https://www.npci.org.in/uploads/FA_Qs_Merchant_Discount_Rate_MDR_on_Select_UPI_P2_M_Transactions_58dba1d39e.pdf) set 15 October (Q5); in October NPCI deferred it to after Diwali, date to be notified [MediaNama](https://www.medianama.com/2026/10/223-npci-delays-upi-mdr-festive-season/). The FAQ's terms:
  - 0.4% on person-to-merchant payments above ₹2,000, capped at ₹300.
  - Payments up to ₹2,000 stay free.
  - Small P2PM merchants receiving up to ₹1 lakh a month via UPI QR pay nothing.
  - The fee can't be passed to customers.
  - Person-to-person transfers stay free.

  Sources: [SCC Online](https://www.scconline.com/blog/post/2026/09/16/npci-released-upi-mdr-faqs-explained/), [Outlook Money](https://www.outlookmoney.com/banking/upi-mdr-of-040-per-cent-from-october-15-what-changes-for-merchants-and-consumers). The FAQ is now readable on npci.org.in (Q3, Q16, Q23-Q24, Q29, Q34; railways, telecom, insurance and fuel pay a flat ₹5 above ₹2,000, Q33). Teach the start date as "to be announced" and recheck before publishing.
- **UPI payment requests:** NPCI ended person-to-person "collect requests" from 1 October 2025; merchants can still send them [Business Today](https://www.businesstoday.in/amp/personal-finance/banking/story/npci-to-tighten-upi-rules-peer-to-peer-collect-feature-to-end-in-october-489244-2025-08-13). A student paid into a personal UPI ID can't send one.
- **Gateways:** Razorpay's standard plan is 2% per transaction plus 18% GST on the fee, with no setup fee [Razorpay](https://razorpay.com/pricing/). Its page still calls UPI "MDR-free", which is now out of date.
- **WhatsApp Business:** the app is free, with a catalogue, quick replies and labels. The paid Platform (API) has charged per message since 1 July 2025; service replies inside the customer-service window are free [Meta](https://developers.facebook.com/docs/whatsapp/pricing).
- **Instagram:** the Shop tab went in 2023 [PhoneArena](https://www.phonearena.com/news/Instagram-will-ditch-the-Shop-tab-in-February_id144742). India kept product tagging without checkout [TechCrunch](https://techcrunch.com/2023/04/27/instagram-facebook-force-checkout-experience-shops-soon/amp/). Teach selling in DMs and WhatsApp, collecting by UPI.

## 6. Marketing on a tiny budget
- **Meta publishes no fixed rupee minimum for ads.** Ads Manager warns when a budget is too low, and cost-per-result bidding wants about 5 times the target cost a day [Relevant Audience](https://www.relevantaudience.com/facebook-ads/facebook-ads-cost-how-meta-charges/).
- Indian D2C guides suggest ₹500 to ₹2,000 a day, organic channels first [eChai](https://echai.ventures/d2c/d2c-meta-ads-fundamentals/budget-to-start-india).
- **Avoid fake urgency and drip pricing,** named in the CCPA dark-pattern guidelines of 30 November 2023 [JSA](https://www.jsalaw.com/newsletters-and-updates/ccpa-issues-guidelines-for-prevention-and-regulation-of-dark-patterns-2023/). Teach this as ethics.

## 7. Finance and first funding
- **Concepts:** price, unit cost, contribution margin, CAC, repeat purchase, monthly cash flow and runway, all worked in ₹.
- **First money**, roughly most to least common for students:
  - Bootstrapping and pre-orders, then friends and family, then competitions and incubators.
  - Loans. PM MUDRA tiers are Shishu up to ₹50,000, Kishore up to ₹5 lakh and Tarun up to ₹10 lakh. Tarun Plus goes up to ₹20 lakh for those who repaid a Tarun loan (October 2024) [Drishti](https://www.drishtiias.com/important-government-schemes/ministry-of-finance/pradhan-mantri-mudra-yojana-pmmy/print_manually).
- **Startup India Seed Fund:** up to ₹20 lakh as a grant and ₹50 lakh as debt, through incubators. It needs DPIIT recognition [IST portal](https://www.indiascienceandtechnology.gov.in/funding-opportunities/startups/startup-india-seed-fund-scheme-sisfs). It started in April 2021 for 4 years, and **I could not confirm it is open in 2026.** Say only that incubators run such schemes.

## 8. Team and HR
- **Co-founders:** YC recommends near-equal splits and 4-year vesting with a 1-year cliff [YC](https://www.ycombinator.com/blog/splitting-equity-among-founders). Teach "write it down, use vesting".
- **Also teach:** roles and decision rights, freelancers paid per deliverable, interns with a clear brief and a learning goal, and culture as a few written habits. Don't quote stipend figures; I found no reliable benchmark.

## 9. Networking and growing through networks
- **What a student can reach:** college E-cells, MoE Institution's Innovation Councils (more than 2,700 institutions by December 2021, a dated figure) [ACET](https://www.acetcbe.edu.in/clubs-and-activities/iic/), Atal Incubation Centres (68 by December 2021) [PIB](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2022/feb/doc202222519701.pdf), alumni and founder meetups.
- **Introductions:** use double opt-in, where the connector asks both people first, plus a short "forwardable" message [Boomerang](https://getboomerang.ai/glossaries/double-opt-in-introductions).
- **LinkedIn** [Help](https://www.linkedin.com/help/billing/answer/a550555):
  - Ignored or rapid invitations can restrict an account for about a week, and automation tools are prohibited.
  - Free members get 5 personalised notes a month; "100 a week" is not official.

  This makes the case for using AI to personalise a few messages, never to mass-send.
- **Growth:** referrals, word of mouth and partnerships (a campus club, a local shop).

## 10. Proposed outline (7 modules, about 9 hours)
About 60 minutes a module (3 cards, 2 tasks, a reflection, 4 questions): 420 minutes, plus a 30-minute final and a 90-minute project, makes 9 hours. **Flag:** 5 real conversations won't fit in 90 minutes. Either count them in the project time or say the project runs over two weeks.

1. **Evaluate an idea with evidence** (foundation): problem, segment, bottom-up market size, competitors and substitutes, Mom Test interviews. AI drafts the script; the learner checks AI's sizing against sources.
2. **Build and test a scrappy MVP:** concierge or landing-page MVP, one free AI builder, a test with 5 users.
3. **Sell to your first customers:** warm lists, a 60-second pitch, objections, asking for UPI payment, follow-up in WhatsApp Business, a pre-order as proof.
4. **Market on a tiny budget:** positioning, one channel, AI-assisted content, a ₹1,000 test with one metric, no dark patterns.
5. **Network and grow through people:** network map, E-cells, incubators and alumni, double opt-in introductions, LinkedIn done right, referrals and partnerships. Placed after Modules 3 and 4 to treat networks as a growth channel; it feeds funding (6) and hiring (7).
6. **Price and manage money:** value-based pricing, unit economics, a one-month budget and cash flow, UPI and gateway fees, first funding.
7. **Build your team:** co-founder fit, equity and vesting, roles, freelancers and interns, culture.

**Final:** 15 questions across all 7 skills.

**Project:** a validated idea (at least 5 real conversations and at least one commitment) and a one-page plan. Rubric: evidence quality (the §2 ladder), problem and segment clarity, MVP test result, price and unit economics, the next 30-day plan.

## Sources
- YC Startup School: https://startupschool.org/
- Startup India Learning Program: https://www.startupindia.gov.in/content/sih/en/learning-and-development.html
- The Mom Test summary: https://mtlynch.io/book-reports/the-mom-test/
- NN/g, Synthetic Users: https://www.nngroup.com/articles/synthetic-users/
- Sean Ellis test: https://learningloop.io/plays/product-market-fit-survey
- CB Insights 2017 via ACA: https://angelcapitalassociation.org/data/Secure/Leadership%20Workshop%20Library/2017-leadership-workshop/20CausesofFailureScorecard.pdf?rev=EE89
- NPCI, UPI MDR FAQ (15 Sept 2026): https://www.npci.org.in/uploads/FA_Qs_Merchant_Discount_Rate_MDR_on_Select_UPI_P2_M_Transactions_58dba1d39e.pdf
- MediaNama, MDR postponed: https://www.medianama.com/2026/10/223-npci-delays-upi-mdr-festive-season/
- Business Today, P2P collect ends: https://www.businesstoday.in/amp/personal-finance/banking/story/npci-to-tighten-upi-rules-peer-to-peer-collect-feature-to-end-in-october-489244-2025-08-13
- UPI MDR FAQ explained: https://www.scconline.com/blog/post/2026/09/16/npci-released-upi-mdr-faqs-explained/
- Razorpay pricing: https://razorpay.com/pricing/
- WhatsApp Platform pricing: https://developers.facebook.com/docs/whatsapp/pricing
- Free AI app builders: https://www.dyad.sh/blog/free-ai-app-builders-compared
- IT Rules 2026: https://www.hoganlovells.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content
- DPDP Rules 2025: https://www.ey.com/en_in/insights/cybersecurity/transforming-data-privacy-digital-personal-data-protection-rules-2025
- Dark patterns: https://www.jsalaw.com/newsletters-and-updates/ccpa-issues-guidelines-for-prevention-and-regulation-of-dark-patterns-2023/
- Meta ad budgets: https://www.relevantaudience.com/facebook-ads/facebook-ads-cost-how-meta-charges/
- eChai D2C budgets: https://echai.ventures/d2c/d2c-meta-ads-fundamentals/budget-to-start-india
- Instagram Shop tab: https://www.phonearena.com/news/Instagram-will-ditch-the-Shop-tab-in-February_id144742
- Meta checkout changes: https://techcrunch.com/2023/04/27/instagram-facebook-force-checkout-experience-shops-soon/amp/
- SmartCompany, why startups fail: https://www.smartcompany.com.au/startupsmart/analysis/startups-fail-founders-capital/
- Outlook Money, UPI MDR: https://www.outlookmoney.com/banking/upi-mdr-of-040-per-cent-from-october-15-what-changes-for-merchants-and-consumers
- IIC count (ACET): https://www.acetcbe.edu.in/clubs-and-activities/iic/
- MUDRA tiers: https://www.drishtiias.com/important-government-schemes/ministry-of-finance/pradhan-mantri-mudra-yojana-pmmy/print_manually
- Seed Fund: https://www.indiascienceandtechnology.gov.in/funding-opportunities/startups/startup-india-seed-fund-scheme-sisfs
- YC on equity: https://www.ycombinator.com/blog/splitting-equity-among-founders
- LinkedIn limits: https://www.linkedin.com/help/billing/answer/a550555
- Double opt-in: https://getboomerang.ai/glossaries/double-opt-in-introductions
- AIM factsheet: https://static.pib.gov.in/WriteReadData/specificdocs/documents/2022/feb/doc202222519701.pdf

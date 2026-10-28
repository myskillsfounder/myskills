# AI-Powered Entrepreneurship — course team report (26 Oct 2026)

**Verdict: ready to publish.** `check.mjs`: ready_to_publish true, 0 must-fix, 0 should-fix. The second review found nothing must-fix, and every module scores 4 or 5 on all eight Module Standard dimensions.

File: `docs/programmes/Entrepreneurship/ai-powered-entrepreneurship.json` (slug `ai-powered-entrepreneurship`)

## What it is
For Indian students and recent graduates starting their first venture, from an idea to first paying customers, with AI at every step and a check on the AI each time. Legal and compliance topics are left for a later version, as Paul decided.

| # | Module | Level | Minutes |
|---|---|---|---|
| 1 | Evaluate an idea with evidence | foundation | 60 |
| 2 | Build and test a scrappy MVP | foundation | 60 |
| 3 | Sell to your first customers | intermediate | 60 |
| 4 | Market on a tiny budget | intermediate | 60 |
| 5 | Network and grow through people | intermediate | 60 |
| 6 | Price and manage money | advanced | 70 |
| 7 | Build your team | advanced | 60 |

- **Overall:** about 7 hours of modules, then about 8 hours of project over two weeks, so 16 hours in all.
- **Tests:** 21 aptitude statements and 28 quiz questions (4 per module).
- **Final:** 15 questions (4 Beginner, 7 Intermediate, 3 Advanced, 1 Expert), 155 marks, pass mark 93 (60%), 30 minutes.
- **Project:** a validated idea backed by at least 5 real customer conversations and one commitment, plus a one-page plan, graded by a mentor on 5 criteria. The main criterion is *evidence*, graded on a ladder: compliment, then past behaviour, then commitment, then money paid.

## What changed in each round
- **Draft:** research, then teaching, then tests.
- **Review 1 (needs work):** 2 must-fix accuracy errors, both about UPI.
  - The merchant fee was said to have "begun on 15 Oct 2026", but NPCI postponed it until after Diwali.
  - Learners were told to send a UPI payment request, but person-to-person requests ended on 1 Oct 2025.
  - It also found 7 should-fixes:
    - the equity-split promise didn't fit solo founders;
    - a market estimate contradicted its own evidence;
    - D2C and PG weren't explained;
    - one quiz question copied a task's scenario;
    - one answer could be argued two ways;
    - one final question was mislabelled as Advanced;
    - the blueprint's UPI note was out of date.
  - All of these were fixed.
- **Review 2 (ready):** 3 small should-fixes: a "his" that should have been "her", and two long sentences. I fixed them directly, using the reviewer's wording.

## Scorecard (first row → last row)
| | Review 1 | Round 2 |
|---|---|---|
| Must-fix per 10 questions | 0.5 | 0 |
| Should-fix per 10 questions | 1.6 | 0.7 |
| Lowest module score | 3 | 4 |
| Mean module score | 4.7 | 4.9 |
| Right answer is the longest option | 11.6% | 11.6% (chance ≈ 25%) |

## Module Standard (review 2)
| Module | Outcome | Explanation | Practice | Feedback | Relevance | Time | Progression | Inclusion |
|---|---|---|---|---|---|---|---|---|
| m01 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 4 |
| m02 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | 5 |
| m03 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 |
| m04 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 |
| m05 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 4 |
| m06 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 |
| m07 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 |

No score is below 4. m03 and m05's inclusion scores were for the two long sentences and the "his", which are now fixed.

## What still needs a person
1. **Recheck the UPI merchant fee start date on npci.org.in before publishing.** NPCI has postponed it with no new date. Module 6 says "start date to be announced" (checked 26 Oct 2026).
2. **Decisions taken as defaults:**
   - final test: 60%, 30 minutes, retake after 7 days;
   - project: pass at a weighted score of 60 or more, with evidence at least 3 out of 5. Weights: evidence 30, problem 15, MVP test 20, money 20, plan 15. Without 5 conversations and one commitment, the project is "incomplete".
   The engine can't store rubric weights yet, so mentors apply them.
3. **Optional review ideas** (in review-2.json):
   - make "Meta does not publish a fixed minimum budget" in Module 4 clearer;
   - say the co-founder instruction in Module 7 t2 once, not twice;
   - shorten the overview summary to 3 sentences.
4. **House style:** the reviewers suggest changing `houseStyle()` in `agents/lib/prompts.mjs` from "3 Learn cards" to "3 to 5".

## Sources worth checking
- NPCI UPI MDR FAQ (15 Sep 2026): https://www.npci.org.in/uploads/FA_Qs_Merchant_Discount_Rate_MDR_on_Select_UPI_P2_M_Transactions_58dba1d39e.pdf
- MediaNama, MDR postponed (Oct 2026): https://www.medianama.com/2026/10/223-npci-delays-upi-mdr-festive-season/
- Person-to-person collect requests ending (Aug 2025): https://www.businesstoday.in/amp/personal-finance/banking/story/npci-to-tighten-upi-rules-peer-to-peer-collect-feature-to-end-in-october-489244-2025-08-13
- Razorpay pricing: https://razorpay.com/pricing/ · LinkedIn invitation limits: https://www.linkedin.com/help/billing/answer/a550555

## Playbook
- **Added rules 9 to 12:**
  - re-check recent regulator dates and payment rules on the regulator's own site;
  - every outcome must be shown by the learner's own work, with a route for those it doesn't fit;
  - don't reuse a task's scenario in that module's quiz;
  - after a fix, re-read every sentence that names the changed person or number.
- **Rule 5 (state regulations exactly) was broken again** by the UPI errors. Rule 9 sharpens it with the step that would have caught them. One more repeat, and it becomes an automatic check.

# AI powered Data Analytics: draft and review

> **Superseded (27 October 2026).** This is the 21 October hand review. It no longer describes the file: its claims about scenarios, `why_wrong` and `learning_outcome` on every question were not true of the file then. The current assessment record is `ai-powered-data-analytics.assessment.md`; the current review is `ai-powered-data-analytics.review-1.json`.

Drafted and reviewed on 21 October 2026, doing by hand what the Course Architect and the Assessment
Agent will do once they are built. The file to load is `ai-powered-data-analytics.json`, next to this
report.

## What is in it

| Part | Count |
| --- | --- |
| Skills | 9: data literacy, data cleaning, SQL, Python, spreadsheets, statistics, visualisation, AI-assisted analysis, storytelling |
| Aptitude test | 27 statements, 3 per skill; one in each three is reversed, so agreeing with everything doesn't score high |
| Modules | 10, from foundation to advanced; each has 3 learn cards, 2 hands-on tasks, a reflection and a 4-question quiz |
| Questions | 40 in module quizzes and 15 in the final test (30 minutes, 60% to pass) |
| Project | Analyse 12 months of an Indian business's data and recommend one change; 5 deliverables, marked against a 5-part rubric |
| Time | About 35 hours: 14 hours of modules, about 20 hours of project work and the final test |

The modules, in order:

1. Thinking like an analyst
2. Spreadsheets that answer questions
3. Cleaning messy data
4. SQL foundations
5. SQL joins and windows
6. Statistics that change decisions
7. Python and pandas for analysis
8. Dashboards people use
9. AI as your analysis partner
10. From numbers to decisions

Every question has a scenario set in an Indian business, an explanation, why the other options are
wrong, and what it teaches. The scenarios include D2C brands, UPI payments, a hospital chain, a
coaching centre and quick commerce.

## What employers ask for, and how the draft covers it

Job posts and hiring guides for Indian data analyst roles in 2026 keep asking for the same core:

- SQL;
- Excel;
- Power BI or Tableau;
- Python with pandas;
- enough statistics to avoid being fooled;
- clear communication.

They now add one more thing: using AI tools such as Copilot in Excel, Python in Excel and Copilot in
Power BI, and checking what they produce. Module 9 is built around that. Modules 8 and 9 also teach
students to check AI-drafted numbers against a figure they trust before sharing them.

These were the sources. Most are blogs or course providers, so treat them as a direction, not as
evidence:

- Skills and roadmaps: [WsCube Tech](https://www.wscubetech.com/blog/data-analyst-skills/), [365 Data Science](https://365datascience.com/career-advice/data-analyst-job-outlook-2025/), [codebasics](https://codebasics.io/blog/data-analyst-roadmap-2026-skills-tools-and-a-step-by-step-learning-plan)
- Excel with Python and Copilot: [TechRadar](https://www.techradar.com/pro/microsoft-excel-is-adding-python-boosted-by-copilot), [Microsoft 365 message RM490212](https://mc.merill.net/message/RM490212), [Eleven Forum, April 2026](https://www.elevenforum.com/t/what-is-new-in-excel-for-april-2026.46455/latest)
- Power BI: [AlphaBOLD](https://www.alphabold.com/power-bi-2026-updates/), [DataBear, January 2026](https://databear.com/power-bi-january-2026/), [Collab365](https://spaces.collab365.com/posts/microsoft-lets-copilot-answer-questions-from-power-Sxig3o)
- Hiring in India: [Taggd](https://taggd.in/blogs/data-science-jobs/), [AccioJob](https://acciojob.com/blogs/latest/data-analyst-data-science-jobs-in-2026-complete-guide-to-the-market-salaries-opportunities-in-india), [Vskills](https://www.vskills.in/certification/blog/data-analyst-jobs-in-2026-real-salary-skills-and-hiring-numbers-nobodys-telling-you/)

## Checks

### The checks Publish runs

The draft passes the same checks the engine runs before Publish:

- every skill has at least two aptitude statements;
- every module has work to do and a reflection;
- quizzes have at least 3 questions;
- every question has 2–6 different options, one right answer and an explanation;
- no ids repeat;
- the project has a brief and a rubric.

### Review round 1: the right answer gave itself away

The right answer was the longest option in 45 of 55 questions, and much longer than the others in 33
of them. Students quickly learn to "pick the long one", and the test stops measuring anything.

**Fix:** I rewrote the wrong options in those 33 questions as real mistakes a learner makes, of a
similar length, and tightened the right answers. The "why the others are wrong" notes changed to match.

### Review round 2: still a clue

The right answer was still the longest option in 38 of 55 questions, often by only a few words.

**Fixes:**

- **Code and formula questions:** their wrong options now look just as complete as the right one.
  - For example, `ROW_NUMBER() OVER (ORDER BY customer_id, order_date)` against the right
    `… PARTITION BY customer_id …`.
  - Another: `pd.to_datetime(…, format="%m/%d/%Y")` against `dayfirst=True`.
- **Other questions:** one wrong option was lengthened, or the right one shortened.

**Result:** the right answer is now the longest option in 10 of 55 questions and the shortest in 7. By
chance you would expect about 14. No right answer is noticeably longer than the others.

### Other fixes

- **Answer positions:** spread evenly: A 14, B 13, C 14, D 14.
- **Time:** the overview said 50 hours, but the modules added up to 9 hours, which is too little for
  2 hands-on tasks each. Module times are now 60–120 minutes (14 hours in all), and the total is
  35 hours.
- **Project rubric:** the generic rubric ("Relevance, Quality…") didn't say what good analysis looks
  like, so each mentor would have marked differently. It now has five parts:
  1. Problem framing
  2. Data quality
  3. Analysis
  4. Dashboard
  5. Recommendation
- **Data protection:** the wording on India's Digital Personal Data Protection Act, 2023 now says that
  data may be used for a lawful purpose with consent or for a few uses the Act permits. Before, it said
  "only purposes people agreed to", which was too narrow.
- **pandas dates:** the explanation now says that without `dayfirst=True` pandas *can* read 05/04/2026
  as 4 May. It depends on the data, so it isn't always.
- **Difficulty spread:** Beginner 17, Intermediate 26, Advanced 12.

## For a human expert to check before publishing

1. **Copilot depends on the licence.** Copilot in Excel and Power BI isn't free. The tasks also work
   with free tools: Google Colab, Looker Studio, and free AI assistants. A mentor should confirm
   students can do every task without a paid licence.
2. **Data protection detail.** Should module 9 also mention the DPDP Rules and when their duties start?
   Someone who follows Indian privacy law should check the current position.
3. **Project data.** Mentors need a short list of good public datasets for Indian businesses, or a
   process for anonymised data a business shares.
4. **Read a module as a student.** Check a module on a phone. Long code options wrap onto two lines.

## How to load it

In the admin portal:

1. Go to **Course engine**, open **AI powered Data Analytics**, then **Check & publish**.
2. Click **Replace the draft…** and paste the whole JSON file into the box.
3. Click **Use this file**, then **Save draft**.
4. Look through the tabs, then **Publish**.

This replaces everything in the current draft, including the skills you had added. If you want to keep
any of them, send me the draft first (**Download** on the same page) and I'll merge them in.

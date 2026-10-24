# AI powered Data Analytics: research brief

**Assessment Agent, round 1, 22 October 2026.** Section 4, the main one, lists real beginner mistakes for the Assessment Architect to use as wrong options.

## 1. What employers in India hire for

- SQL comes first in entry-level analyst postings. SQL plus Power BI or Tableau is what gets a candidate hired, and Python (pandas) is the next skill they expect [codebasics roadmap 2026](https://codebasics.io/blog/data-analyst-roadmap-2026-skills-tools-and-a-step-by-step-learning-plan); [AccioJob 2026 guide](https://acciojob.com/blogs/latest/data-analyst-data-science-jobs-in-2026-complete-guide-to-the-market-salaries-opportunities-in-india).
- One real Indian remote posting (NTT DATA, 2026) asks for SQL, Python for cleaning and statistics, and Power BI dashboards [NTT DATA posting](https://careers-inc.nttdata.com/job/Remote-Data-Analyst-KA/1359907900).
- **Not confirmed:** I found no primary Naukri JobSpeak, NASSCOM or foundit report. Blogs quote job counts, growth rates and salary premiums without a traceable source. The programme should not quote any market figure. Its current choice of skills (Excel, SQL, pandas, statistics, Power BI, AI, storytelling) matches all the sources above.

## 2. Tools: what changed in the last 12 months

- **pandas 3.0** came out on 21 January 2026. String columns now get a dedicated `str` type. Copy-on-Write is the default, so chained assignment (`df["a"][mask] = x`) no longer works and `df.loc[mask, "a"] = x` is the way to do it. Datetimes now default to microseconds [pandas 3.0.0 what's new](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html); [pandas blog](https://pandas.pydata.org/community/blog/pandas-3.0.html). Every line of code in M7 still works under 3.0.
- **`dayfirst=True` is not strict.** pandas' documentation warns that it only "will prefer to parse with day first". A fixed `format="%d/%m/%Y"` is the strict way to read Indian dates [pandas.to_datetime](https://pandas.pydata.org/docs/reference/api/pandas.to_datetime.html).
- **Copilot in Power BI** needs a paid Fabric capacity (F2 or higher) or Premium (P1 or higher). Pro, PPU, trial and free licences don't qualify [DataBear 2026](https://databear.com/enable-copilot-power-bi-fabric-2026/); [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5844828/question-about-copilot-availability-with-fabric-an). I couldn't open the Microsoft Learn page itself, so these are secondary sources. Students won't have access, so M8 needs to give a free route.
- **Python in Excel** is included for Business and Enterprise Microsoft 365 on Windows (Current Channel). It is a preview on Family, Personal and Education plans, and it isn't supported on device-based licences [Microsoft: Python in Excel availability](https://support.microsoft.com/en-us/excel/python/python-in-excel-availability). Google Colab remains the free route.
- **Copilot in Excel:** Microsoft says it "can sometimes make mistakes", "can't … evaluate accuracy", and that you should verify anything it creates and work on a copy of important workbooks [Microsoft Copilot in Excel FAQ](https://support.microsoft.com/office/7a13758f-d61e-4a56-8440-f2c9a07802ec).

## 3. Law: India first

- **DPDP Rules, 2025** were notified on 13 November 2025 and come in by phases. Consent-manager duties start after 12 months. Most data-fiduciary duties start after 18 months, about 13 May 2027 [The Week/PTI](https://www.theweek.in/wire-updates/business/2025/11/14/del148-biz-dpdp-rules-ld-govt.html); [EY India](https://www.ey.com/en_in/insights/cybersecurity/transforming-data-privacy-digital-personal-data-protection-rules-2025); [AZB & Partners](https://www.azbpartners.com/?p=87799). Sources word the phases a little differently, and I didn't check the Gazette text. M9 card 3 already describes the Act correctly (consent or certain legitimate uses, kept safe) and gives no dates. It should stay that way.
- **Open data:** data.gov.in (MeitY/NIC) publishes free datasets under the Government Open Data Licence – India, which allows reuse with attribution [data.gov.in brochure](https://data.gov.in/sites/default/files/brochure.pdf); [Open Government Partnership](https://www.opengovpartnership.org/stories/india-government-sets-its-data-free/).

## 4. Common beginner mistakes, ready to use as wrong options

Each line below names a mistake and the documented behaviour that makes it a mistake. A good wrong option is the mistake stated confidently, with the reason a learner would give for it.

**Excel**
- **Leaves VLOOKUP's last argument out, or sets it to TRUE, expecting an exact match.** The default is approximate match, which needs sorted data and can return a wrong value without any error [Microsoft VLOOKUP](https://support.microsoft.com/en-us/office/vlookup-function-0bbc8083-26fe-4963-8ab8-93a18ad188a1).
- **Thinks XLOOKUP needs sorted data, or that its 4th argument sets the match type.** XLOOKUP's default is exact match, and the 4th argument is the "not found" value [Microsoft XLOOKUP](https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929).
- **Blames the formula when a lookup fails on values that look the same.** The real cause is trailing spaces, or numbers stored as text [Microsoft VLOOKUP](https://support.microsoft.com/en-us/office/vlookup-function-0bbc8083-26fe-4963-8ab8-93a18ad188a1). TRIM doesn't remove non-breaking spaces (CHAR(160)) and doesn't turn text into numbers. Converting codes with leading zeros changes them (00125 becomes 125) [TheBricks guide](https://thebricks.com/resources/how-to-remove-spaces-in-excel-before-numbers) (a secondary source).
- **Fills a formula down without `$`, so the rate cell drifts (F1, F2, F3…).** References are relative by default [Microsoft: relative and absolute references](https://support.microsoft.com/en-us/Excel/switch-between-relative-absolute-and-mixed-references).
- **Writes SUMIF with the arguments in the SUMIFS order** (SUMIF is range, criteria, [sum_range]) [Microsoft SUMIF](https://support.microsoft.com/en-us/office/sumif-function-169b8c99-c05c-4483-a712-1697a653039b).

**SQL**
- **Uses COUNT(column) expecting it to count NULLs, or thinks COUNT(\*) skips them.** COUNT(\*) counts every row, while COUNT(column), SUM and AVG use only non-null values [PostgreSQL aggregate functions](https://www.postgresql.org/docs/current/functions-aggregate.html).
- **Thinks AVG divides by all rows, so NULLs count as 0.** **Expects SUM of no rows to be 0.** It returns NULL, and COALESCE is the fix [PostgreSQL](https://www.postgresql.org/docs/current/functions-aggregate.html).
- **Writes `= NULL` instead of `IS NULL`.** The m04-q3 behaviour was confirmed in SQLite by the Assessment Architect (blueprint, 2026-10-21).
- **Puts a condition on the right-hand table in WHERE after a LEFT JOIN.** The unmatched rows are dropped, so the query behaves like an INNER JOIN. The condition belongs in ON [Broadcom KB](https://knowledge.broadcom.com/external/article/16455/sql-clause-on-versus-where.html); [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/a/1537783).
- **Joins a one-to-many table and then sums the "one" side,** which double counts. The programme already teaches this in M5 card 2.

**pandas**
- **Combines conditions with `and`, or leaves out the brackets.** `df['A'] > 2 & df['B'] < 3` is evaluated as `df['A'] > (2 & df['B']) < 3`. Each condition needs its own brackets, joined with `&`, `|` or `~` [pandas indexing guide](https://pandas.pydata.org/docs/user_guide/indexing.html).
- **Trusts `dayfirst=True` as a guarantee.** It is only a preference [pandas.to_datetime](https://pandas.pydata.org/docs/reference/api/pandas.to_datetime.html).
- **Uses chained assignment, which silently does nothing in pandas 3.0** [pandas 3.0.0](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html).

**Statistics**
- **Reads p > 0.05 as proof of no effect.** A non-significant result "does not mean that there is no difference" [PMC review of the ASA statement](https://pmc.ncbi.nlm.nih.gov/articles/PMC4885969).
- **Reads a p-value as the probability the hypothesis is true, or treats "significant" as "big".** It is neither [same source](https://pmc.ncbi.nlm.nih.gov/articles/PMC4885969).
- **Trusts the overall rate when a subgroup mix explains it (Simpson's paradox).** At Berkeley in 1973, about 44% of men and 35% of women were admitted overall, yet in most departments women did as well or better [Answering Questions with Data, 1.3](https://oer.xyzhomework.com/ebooks/html/answering-questions-with-data/ch01/1-3-the-cautionary-tale-of-simpson-s-paradox.html).
- **Thinks a margin of error fixes a biased sample, or that a sample must be a big share of the population.** I found no primary source in this search. Use these only where the scenario makes the mistake plain.

**Dashboards**
- **Starts a bar chart's axis above zero.** Readers take in the exaggerated message, and the rule is relaxed for line charts [Datawrapper](https://www.datawrapper.de/academy/why-our-column-and-bar-charts-start-at-zero); [Observable](https://observablehq.com/blog/never-okay-crop-y-axis-except-when-it-is). This makes a good near-miss: "a line chart should also start at zero" sounds right but isn't the rule.

**AI-assisted analysis**
- **Treats code that runs, or the assistant's own re-check, as verification.** Microsoft says Copilot can't evaluate its own accuracy [Copilot in Excel FAQ](https://support.microsoft.com/office/7a13758f-d61e-4a56-8440-f2c9a07802ec). Realistic wrong checks: ask a second AI, rerun the code, see whether the number is in a usual range, read the formula without recomputing.
- **Thinks a paid plan, a history-off setting, initials in place of names, or a small sample makes personal data safe to paste.** The DPDP Act's tests are purpose, consent or a legitimate use, and safeguards, not the tool's settings (see section 3).

## 5. Free tools and data

- Google Colab; Power BI Desktop (free, no Copilot); Excel for the web or Google Sheets; SQLite or PostgreSQL; data.gov.in.

## 6. What in the outline is out of date, wrong or missing

- **M7 card 2** presents `dayfirst=True` as reading Indian dates reliably. It should add the strict `format="%d/%m/%Y"` (playbook rule 8).
- **M8 card 3** says "Copilot can draft measures" without saying that it needs paid capacity, and gives no free route.
- **M7 card 1** mentions Python in Excel without its licence limits.
- **Missing from the cards:** COUNT(\*) against COUNT(column), and NULLs; the LEFT JOIN + WHERE trap; "not significant ≠ no effect"; Simpson's paradox; `&` with brackets. Several quiz questions depend on some of these (see the review).

## Sources
- pandas 3.0.0 what's new: https://pandas.pydata.org/docs/whatsnew/v3.0.0.html
- pandas 3.0 released (blog): https://pandas.pydata.org/community/blog/pandas-3.0.html
- pandas.to_datetime: https://pandas.pydata.org/docs/reference/api/pandas.to_datetime.html
- pandas indexing and selecting data: https://pandas.pydata.org/docs/user_guide/indexing.html
- PostgreSQL aggregate functions: https://www.postgresql.org/docs/current/functions-aggregate.html
- Broadcom KB, SQL clause ON versus WHERE: https://knowledge.broadcom.com/external/article/16455/sql-clause-on-versus-where.html
- Microsoft Q&A, LEFT JOIN acting as INNER: https://learn.microsoft.com/en-us/answers/a/1537783
- Microsoft VLOOKUP: https://support.microsoft.com/en-us/office/vlookup-function-0bbc8083-26fe-4963-8ab8-93a18ad188a1
- Microsoft XLOOKUP: https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
- Microsoft SUMIF: https://support.microsoft.com/en-us/office/sumif-function-169b8c99-c05c-4483-a712-1697a653039b
- Microsoft relative and absolute references: https://support.microsoft.com/en-us/Excel/switch-between-relative-absolute-and-mixed-references
- TheBricks, spaces before numbers: https://thebricks.com/resources/how-to-remove-spaces-in-excel-before-numbers
- Microsoft Copilot in Excel FAQ: https://support.microsoft.com/office/7a13758f-d61e-4a56-8440-f2c9a07802ec
- Microsoft Python in Excel availability: https://support.microsoft.com/en-us/excel/python/python-in-excel-availability
- DataBear, enable Copilot in Power BI 2026: https://databear.com/enable-copilot-power-bi-fabric-2026/
- Microsoft Q&A, Copilot with Fabric: https://learn.microsoft.com/en-us/answers/questions/5844828/question-about-copilot-availability-with-fabric-an
- PMC review of the ASA statement on p-values: https://pmc.ncbi.nlm.nih.gov/articles/PMC4885969
- Answering Questions with Data, Simpson's paradox: https://oer.xyzhomework.com/ebooks/html/answering-questions-with-data/ch01/1-3-the-cautionary-tale-of-simpson-s-paradox.html
- Datawrapper, why bar charts start at zero: https://www.datawrapper.de/academy/why-our-column-and-bar-charts-start-at-zero
- Observable, cropping the y-axis: https://observablehq.com/blog/never-okay-crop-y-axis-except-when-it-is
- The Week/PTI, DPDP Rules notified: https://www.theweek.in/wire-updates/business/2025/11/14/del148-biz-dpdp-rules-ld-govt.html
- EY India, DPDP Rules 2025: https://www.ey.com/en_in/insights/cybersecurity/transforming-data-privacy-digital-personal-data-protection-rules-2025
- AZB & Partners, DPDP framework: https://www.azbpartners.com/?p=87799
- data.gov.in brochure: https://data.gov.in/sites/default/files/brochure.pdf
- Open Government Partnership, India: https://www.opengovpartnership.org/stories/india-government-sets-its-data-free/
- codebasics, data analyst roadmap 2026: https://codebasics.io/blog/data-analyst-roadmap-2026-skills-tools-and-a-step-by-step-learning-plan
- AccioJob, data analyst jobs 2026: https://acciojob.com/blogs/latest/data-analyst-data-science-jobs-in-2026-complete-guide-to-the-market-salaries-opportunities-in-india
- NTT DATA, Remote Data Analyst posting: https://careers-inc.nttdata.com/job/Remote-Data-Analyst-KA/1359907900

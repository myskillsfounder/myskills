# AI-Powered Data Analytics: research brief

Assessment Agent, 27 October 2026. For the improve job on `ai-powered-data-analytics.json` (Course engine address `data-analytics`). Primary sources first; where only blogs exist, that is said.

## 1. What employers in India hire for

- **The core stack is stable: SQL, Excel, one BI tool, then Python.** Indian career guides for 2026 agree that SQL, Excel and Power BI or Tableau get freshers shortlisted, with Python "a strong fifth" that many junior MIS and analyst roles in BFSI, FMCG and manufacturing still don't require ([Skillovilla](https://www.skillovilla.com/blogs/data-analyst-skills-required), [AcceleratorX](https://acceleratorx.org/blogs/entry-level-data-analyst-career-guide)). One guide quotes SQL in 74% of postings, advanced Excel 68%, Power BI/Tableau 52% and Python 41%, but names no data source ([Skillovilla](https://www.skillovilla.com/blogs/data-analyst-skills-required)). **Could not confirm** any percentage from a primary hiring report (Naukri JobSpeak or LinkedIn). Treat these as direction, not figures to quote.
- **AI and data skills now travel together.** LinkedIn's *Skills on the Rise 2026* for India groups rising skills into five stacks, one of them data and analytics, and stresses working with AI tools and interpreting data ([afaqs](https://www.afaqs.com/news/mktg/linkedin-report-maps-five-skill-stacks-shaping-the-job-market-in-2026-11176287), [Storyboard18](https://www.storyboard18.com/brand-makers/linkedins-skills-on-the-rise-2026-identifies-top-skill-stacks-reshaping-indias-workforce-90556.htm)). These are press reports of the report, not the report itself.
- **Fresher pay** is quoted at about ₹3.5 to 9 LPA depending on city and stack ([Skillfloor](https://skillfloor.com/blog/entry-level-data-analyst-jobs), [AcceleratorX](https://acceleratorx.org/blogs/entry-level-data-analyst-career-guide)). Blog figures; don't put them in the programme.
- **What the programme covers well:** SQL gets two modules (8 quiz questions), Excel, pandas, Power BI, statistics, AI verification and storytelling are all there. **What is thin:** Google Sheets and Looker Studio (the free route most MySkills students will actually use) appear only in a summary and the project; SUMIFS/COUNTIFS (everyday MIS work) is never taught though da-f03 tests it; LAG/LEAD, which interviewers ask about, is tested (da-f08) but not taught.

## 2. Tools: what is current and what changed

| Tool | Current fact | Source | What it means for the file |
| --- | --- | --- | --- |
| **XLOOKUP** | In Excel for Microsoft 365, 2021 and 2024, and in Google Sheets. Microsoft's own page says it is **not available in Excel 2016 and 2019**. Default match is exact; no match and no if_not_found gives #N/A. | [Microsoft](https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929), [Google](https://support.google.com/docs/answer/12405947) | da-m02 card 2 is correct, but should say old college-lab Excel may lack it and Google Sheets has it. |
| **Tables** | Google Sheets has had *Format > Convert to table* since 2024. Ctrl+T is Excel only. | [Google Workspace Updates, May 2024](https://workspaceupdates.googleblog.com/2024/05/tables-in-google-sheets.html) | da-m02 card 1 teaches only Ctrl+T. Add the Sheets route. |
| **Python in Excel** | Not free: "Free consumer and perpetual consumer licenses don't support Python in Excel." GA for Business/Enterprise; preview only for Personal/Family; not on phones. | [Microsoft](https://support.microsoft.com/en-us/excel/python/python-in-excel-availability) | da-m07 card 1 presents it beside free Colab with no "paid" flag (playbook rule 7). |
| **Copilot in Power BI** | Needs paid Fabric capacity (F2 or higher) or Premium P1+. "Trial capacities and free SKUs aren't supported." A Pro or PPU licence alone isn't enough. | [Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-introduction) | da-m08 card 3, summary and q4 treat Copilot as a normal step. Say it is a paid, company-provided feature and give the free route. |
| **Power BI Desktop** | Free, but **Windows only** (Windows 10 or later), and needs at least a 1440x900 screen. No Mac or phone version. | [Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/fundamentals/desktop-get-the-desktop) | Many students have only a phone or a Mac. Looker Studio (free, browser) or Google Sheets charts must be a named route. |
| **Copilot in Excel (consumer)** | Microsoft 365 Personal and Family now include a monthly allowance of AI credits (60 a month for Personal reported), at a higher subscription price; a "Classic" plan without Copilot exists. | [TechRadar](https://www.techradar.com/pro/copilot-is-now-coming-to-all-microsoft-365-users-but-youll-pay-a-little-more-for-the-privilege), [Office Watch](https://office-watch.com/2025/all-about-ai-credits-in-microsoft-365) | Still paid. **Could not confirm** India prices; don't state any. |
| **Gemini in Google Sheets** | Reported as unavailable on free personal accounts (needs Google AI Pro or a Workspace plan). | [Jotform guide](https://www.jotform.com/ai/how-to-use-gemini-in-google-sheets/), [Dupple](https://dupple.com/learn/how-to-use-ai-in-google-sheets) | Secondary sources only. Don't promise it; free chat assistants (ChatGPT, Claude, Gemini apps) are the free route. |
| **pandas** | **pandas 3.0.0 released 21 January 2026**: a dedicated string dtype by default, Copy-on-Write always on (chained assignment no longer works), default datetime resolution generally microseconds. | [pandas what's new 3.0.0](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html), [pandas blog](https://pandas.pydata.org/community/blog/pandas-3.0.html) | Nothing in the file is wrong for 3.0 (the blueprint ran the code on 3.0.6). A card could warn that old tutorials' `df[df.x > 5]["y"] = 0` no longer changes df; use `df.loc[...]`. |
| **pandas dates** | `dayfirst=True` prefers day-first but the docs call it "not strict"; `format="%d/%m/%Y"` is strict. | [pandas to_datetime](https://pandas.pydata.org/docs/reference/api/pandas.to_datetime.html) | Rule 8: the da-m07 card should show `format=` as the safe choice. |
| **Power BI visual calculations** | Reported generally available in the May 2026 update. | [Collab365 repost](https://spaces.collab365.com/posts/power-bi-enables-calculations-in-charts-without-da-JlDtcG) | **Could not confirm** on Microsoft's own blog. The da-m08 card's mention is harmless either way. |

## 3. Law: India's DPDP Act and Rules

- **The Act (Section 4):** personal data may be processed only for a lawful purpose (one not expressly forbidden by law), **with consent or for certain legitimate uses** ([dpdpa.com, Section 4 text](https://dpdpa.com/dpdpa2023/chapter-2/section4.html)). Section 7 lists the legitimate uses, such as data a person gave voluntarily for a stated purpose, employment, legal duties and medical emergencies ([Bar & Bench](https://www.barandbench.com/view-point/navigating-legitimate-use-exemption-employee-data-digital-personal-data-protection-act-2023)). da-m09 card 3's wording matches the Act.
- **The Rules:** the DPDP Rules, 2025 (G.S.R. 846(E)) were notified on 13 November 2025. Rules on the Data Protection Board applied at once. Consent Manager rules (Rule 4) apply from **13 November 2026**, 17 days from today. Most duties on organisations (notice, security safeguards, breach reporting, Rules 3 and 5 to 16) apply **18 months after notification, around 13 May 2027** ([SCC Online](https://www.scconline.com/blog/post/2025/11/14/meity-notified-digital-personal-data-protection-rules-2025/), [EY](https://www.ey.com/en_in/technical/alerts-hub/2025/11/digital-data-protection-act-rules-notified-by-meity), [Mondaq](https://www.mondaq.com/india/data-protection/1708164/digital-personal-data-protection-rules-2025-notified)). Some summaries say 14 May 2027 (from the gazette publication date). **Could not open the MeitY page** (HTTP 403). So: write "most duties apply from May 2027", not a day, unless someone confirms the date in the Gazette.
- **For the module:** the card is right not to give dates. It can add one sentence: "The DPDP Rules, 2025 phase in its duties; most apply to organisations from May 2027, but good practice starts now." Under playbook rule 9, the 13 November 2026 Consent Manager date falls within 90 days. The file doesn't mention it, and shouldn't need to.

## 4. Common beginner mistakes (good wrong options)

All of these are confirmed by the blueprint's runs (pandas 3.0.6, SQLite 3.50.4) or the official docs above:
- Using `= NULL` instead of `IS NULL`; forgetting that AVG skips NULLs but COUNT(*) does not.
- Writing `BETWEEN '2026-04-01' AND '2026-04-30'` on a timestamp column, which drops 30 April after midnight.
- Joining one-to-many and summing (fan-out); filtering an `o.` column in WHERE after a LEFT JOIN, which turns it into an inner join.
- VLOOKUP with an approximate match (TRUE) on unsorted data; lookups failing on trailing spaces or text-stored numbers.
- pandas: Python `and` instead of `&`; chained assignment (silently does nothing in pandas 3); letting pandas guess dd/mm dates.
- Truncated bar-chart axes; pies with many slices; "Sum, % of column total" read as a rate.
- Trusting AI code because it runs; pasting personal data into public chatbots; asking the AI to check itself.

## 5. Free tools and data for students

- **Spreadsheets:** Google Sheets (free, works in a phone browser and app) has XLOOKUP, tables and pivot tables ([Google](https://support.google.com/docs/answer/12405947)).
- **SQL without installing anything:** the DuckDB shell runs a full database in the browser on any device, reads CSV files, and sends no data to a server ([DuckDB docs](https://www.duckdb.org/docs/current/clients/wasm/overview)). The BigQuery sandbox needs no card or billing account: 10 GB storage and 1 TB of queries a month, and tables expire after 60 days ([Google Cloud](https://docs.cloud.google.com/bigquery/docs/sandbox)).
- **Python:** Google Colab is free; Google doesn't publish fixed limits, and free sessions can be cut off when idle ([Colab FAQ](https://research.google.com/colaboratory/faq.html)). It is usable but awkward on a phone, so tasks should say a laptop or a college lab helps.
- **Dashboards:** Looker Studio is free, with a free Google Sheets connector ([Coefficient](https://coefficient.io/is-looker-studio-free), secondary). Power BI Desktop is free but Windows only.
- **Indian open data:** data.gov.in publishes ministry and state datasets as CSV and XLS ([India.gov.in services](https://services.india.gov.in/service/detail/open-government-data-platform-india-1)). It is good for project data. Check the licence terms on each dataset.

## 6. What in the file is out of date, wrong or missing

1. **Paid tools shown as if free:** Python in Excel (da-m07 card 1), Copilot in Power BI (da-m08 summary, card 3, q4), Copilot in Excel (da-m09 card 1). Each needs a "paid" flag and a free route (rule 7).
2. **Windows/desktop assumptions:** Ctrl+T and Power BI Desktop. Phone and Mac users need the Google Sheets and Looker Studio routes.
3. **DPDP:** the wording is correct. It could add the phase-in (most duties from May 2027).
4. **Taught versus tested:** the quizzes and final test things no card teaches: correlation versus causation (da-m01-q4), absolute references (da-m02-q4), NULL handling (da-m04-q3, q4), `&` filters (da-m07-q4), LAG (da-f08) and SUMIFS (da-f03).
5. **Factual slips:** da-m08-q2 (an axis from ₹99 lakh makes the bar 3 times taller, not 5); da-f05's option names "satisfaction score" in an income question; da-m02-q2's why_wrong names "the third option", but the swapped XLOOKUP is the second, and option order can be shuffled.
6. **Missing:** practice on real data. No module gives the learner a dataset to work on; every task is a plan or a description.

## Sources

- Skillovilla, Data Analyst Skills Required in 2026: https://www.skillovilla.com/blogs/data-analyst-skills-required
- AcceleratorX, Entry-level data analyst career guide: https://acceleratorx.org/blogs/entry-level-data-analyst-career-guide
- Skillfloor, Entry-level data analyst jobs 2026: https://skillfloor.com/blog/entry-level-data-analyst-jobs
- afaqs, LinkedIn Skills on the Rise 2026: https://www.afaqs.com/news/mktg/linkedin-report-maps-five-skill-stacks-shaping-the-job-market-in-2026-11176287
- Storyboard18, LinkedIn Skills on the Rise 2026 India: https://www.storyboard18.com/brand-makers/linkedins-skills-on-the-rise-2026-identifies-top-skill-stacks-reshaping-indias-workforce-90556.htm
- Microsoft, XLOOKUP function: https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
- Google, XLOOKUP in Sheets: https://support.google.com/docs/answer/12405947
- Google Workspace Updates, Tables in Google Sheets: https://workspaceupdates.googleblog.com/2024/05/tables-in-google-sheets.html
- Microsoft, Python in Excel availability: https://support.microsoft.com/en-us/excel/python/python-in-excel-availability
- Microsoft Learn, Copilot for Power BI overview: https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-introduction
- Microsoft Learn, Download Power BI Desktop: https://learn.microsoft.com/en-us/power-bi/fundamentals/desktop-get-the-desktop
- TechRadar, Copilot comes to Microsoft 365 consumer plans: https://www.techradar.com/pro/copilot-is-now-coming-to-all-microsoft-365-users-but-youll-pay-a-little-more-for-the-privilege
- Office Watch, AI credits in Microsoft 365: https://office-watch.com/2025/all-about-ai-credits-in-microsoft-365
- Jotform, Gemini in Google Sheets 2026: https://www.jotform.com/ai/how-to-use-gemini-in-google-sheets/
- Dupple, AI in Google Sheets 2026: https://dupple.com/learn/how-to-use-ai-in-google-sheets
- pandas, What's new in 3.0.0: https://pandas.pydata.org/docs/whatsnew/v3.0.0.html
- pandas, 3.0 released: https://pandas.pydata.org/community/blog/pandas-3.0.html
- pandas, to_datetime: https://pandas.pydata.org/docs/reference/api/pandas.to_datetime.html
- Collab365, visual calculations GA (repost): https://spaces.collab365.com/posts/power-bi-enables-calculations-in-charts-without-da-JlDtcG
- dpdpa.com, DPDP Act Section 4: https://dpdpa.com/dpdpa2023/chapter-2/section4.html
- Bar & Bench, legitimate uses under the DPDP Act: https://www.barandbench.com/view-point/navigating-legitimate-use-exemption-employee-data-digital-personal-data-protection-act-2023
- SCC Online, MeitY notifies DPDP Rules 2025: https://www.scconline.com/blog/post/2025/11/14/meity-notified-digital-personal-data-protection-rules-2025/
- EY, DPDP Rules notified: https://www.ey.com/en_in/technical/alerts-hub/2025/11/digital-data-protection-act-rules-notified-by-meity
- Mondaq, DPDP Rules 2025 notified: https://www.mondaq.com/india/data-protection/1708164/digital-personal-data-protection-rules-2025-notified
- DuckDB, Wasm overview: https://www.duckdb.org/docs/current/clients/wasm/overview
- Google Cloud, BigQuery sandbox: https://docs.cloud.google.com/bigquery/docs/sandbox
- Google, Colab FAQ: https://research.google.com/colaboratory/faq.html
- Coefficient, Is Looker Studio free: https://coefficient.io/is-looker-studio-free
- India.gov.in, Open Government Data Platform: https://services.india.gov.in/service/detail/open-government-data-platform-india-1

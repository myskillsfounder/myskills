# Does the AI guide convert better? A GA4 funnel

The website sends an event at every step of the AI guide (`/start`), and tags
every visitor with a **site mode**:

| site_mode  | Who                                                        |
|------------|------------------------------------------------------------|
| `ai`       | A computer visitor on the AI guide (the default)           |
| `standard` | A computer visitor who switched to the standard website    |
| `phone`    | Anyone on a phone (the "I want to learn…" front door)      |

## The events

| Step                     | AI guide                              | Standard website                         |
|--------------------------|---------------------------------------|------------------------------------------|
| 1. Arrived               | `page_view`, page contains `/start`   | `page_view` of the home page             |
| 2. Asked for a plan      | `guide_ask`                           | (none)                                   |
| 3. Started the test      | `guide_test`                          | `page_view`, page contains `/aptitude-assessment` |
| 4. Finished the test     | `aptitude_answered_guest`             | `aptitude_answered_guest`                |
| 5. Went to sign up       | `results_signup` (the results screen's button; `guide_signup` on the Foundation path) | `results_signup` |
| 6. Signed up             | `sign_up`                             | `sign_up`                                |

Also: `site_mode` (an event: someone switched experience), `guide_step`,
`programme_waitlist` leads (`generate_lead`).

## One-time set-up (2 minutes)

The site mode is a *user property*; GA4 only reports on it once it's
registered.

1. In GA4: **Admin** (gear, bottom left) → **Data display** → **Custom definitions**.
2. **Create custom dimension**:
   - Dimension name: `Site mode`
   - Scope: **User**
   - User property: `site_mode`
3. **Save.** Data is collected from the moment this deploy is live, and shows in reports after a day or two.

## The funnel (5 minutes)

1. **Explore** (left menu) → **Funnel exploration**.
2. Click the pencil next to **Steps** and add:
   1. *Opened the guide*: event `page_view`, add parameter `page_location` **contains** `/start`
   2. *Asked for a plan*: event `guide_ask`
   3. *Started the test*: event `guide_test`
   4. *Finished the test*: event `aptitude_answered_guest`
   5. *Went to sign up*: event `results_signup`
   6. *Signed up*: event `sign_up`
3. **Apply.**
4. Under **Breakdown**, add the dimension **Site mode** (from Custom), so each step is split by `ai`, `standard` and `phone`.
5. Name the exploration "AI guide funnel" (top left).

For the standard website, duplicate it (⋮ → Duplicate), replace steps 1–3
with *Home page* (`page_view`, `page_location` **ends with** `myskills.org.in/`)
and *Opened the test* (`page_view`, `page_location` **contains** `/aptitude-assessment`),
and keep *Finished the test*, *Went to sign up* and *Signed up*.

## The quick answer, without a funnel

**Reports** → **Engagement** → **Events** → click **Add comparison** (top) →
**Site mode** = `ai`, then another for `standard`. Compare the counts of
`aptitude_answered_guest` and `sign_up` against the number of users in each.

## Reading it

Give it two weeks of traffic before deciding. The number that matters is
**sign-ups ÷ visitors** for `ai` against `standard`. If the guide loses
people, the funnel shows the step: a big drop between *Started* and *Finished*
means the test is too long before sign-up; between *Finished* and *Signed up*,
the results screen isn't persuasive enough.

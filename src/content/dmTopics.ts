/**
 * The Digital Marketing topic pages (Paul, 17 Nov 2026: "a dashboard for topics
 * where there is a topic, vocabulary, a small task, a tip and few more things,
 * like a whole textbook page"). One chapter per skill track in lib/skillTracks.ts,
 * same slug. The key terms are picked from lib/vocabulary.ts by id, so a term
 * learned here counts toward the Vocabulary Builder and the Foundation unlock.
 *
 * Plain, careful wording: Paul reads and approves this copy.
 */

export interface TopicChapter {
  /** matches a slug in lib/skillTracks.ts */
  slug: string
  /** about how long the whole topic takes, in minutes */
  minutes: number
  /** one line under the title */
  hook: string
  /** the big idea: short paragraphs, plain words */
  idea: string[]
  /** a margin note beside the big idea */
  note: string
  /** ids from lib/vocabulary.ts, the six to know first */
  terms: string[]
  tip: string
  mistake: string
  task: {
    title: string
    brief: string
    placeholder: string
    /** what a good answer looks like, shown once the task is marked done */
    after: string
  }
}

export const TOPIC_CHAPTERS: TopicChapter[] = [
  {
    slug: 'marketing-fundamentals',
    minutes: 25,
    hook: 'Start with the customer. Everything else follows from who they are and what they need.',
    idea: [
      'Marketing is finding out what people need and offering it in a way they want to buy. It starts with the customer, not with the product.',
      'Before you write an ad or post, answer three questions: who is this for, what problem does it solve for them, and why you instead of someone else? The rest of marketing is carrying those answers to the right people.',
    ],
    note: 'Sell the result the customer gets, not the thing you make.',
    terms: ['marketing', 'customer-need', 'target-audience', 'marketing-mix-4ps', 'marketing-funnel', 'usp'],
    tip: 'Finish this sentence before any campaign: “We help [who] to [do what] so that [result].” If you can’t, the campaign isn’t ready.',
    mistake: 'Trying to sell to everyone. “Everyone” isn’t a target audience, and an ad written for everyone speaks to no one.',
    task: {
      title: 'Describe the customer of a local business',
      brief:
        'Pick a business you know: a tailor, a tuition centre, a tea stall. Write who its customer is (age, area, one need), the problem it solves, and the one thing that makes it different from the shop next door.',
      placeholder: 'Customer: … Problem it solves: … What makes it different: …',
      after:
        'A good answer is specific. “Working women aged 25–40 in Kochi who can’t find time for a fitting” is useful. “Everyone who wears clothes” is not.',
    },
  },
  {
    slug: 'market-research',
    minutes: 25,
    hook: 'Replace guessing with evidence, using free tools and a few honest conversations.',
    idea: [
      'Market research is how you learn what customers actually think and do. Primary research is when you ask people yourself: a short survey, an interview, watching someone use the product. Secondary research is using what others already published: reviews, reports, search suggestions.',
      'You don’t need a budget to start. Talk to five real customers, read competitors’ reviews, and notice what people type into a search box. Look for the same complaint appearing again and again: that is a customer pain point.',
    ],
    note: 'Five honest conversations beat fifty guesses.',
    terms: ['market-research', 'primary-research', 'secondary-research', 'surveys', 'customer-pain-points', 'search-intent'],
    tip: 'Read a competitor’s 3-star reviews. People who are half happy say exactly what is missing.',
    mistake: 'Asking leading questions such as “Don’t you love our service?”. People answer politely. Ask “What was the most annoying part?” instead.',
    task: {
      title: 'Ask three people one question',
      brief:
        'Choose a product or service (for example, home tuition). Ask three people who might buy it: “What is the most annoying thing about this?” Write each answer, then note the pattern.',
      placeholder: 'Person 1: … Person 2: … Person 3: … The pattern I see: …',
      after:
        'Look for the answer that appears more than once. That repeated complaint is the one an ad or a better offer should speak to.',
    },
  },
  {
    slug: 'meta-ads',
    minutes: 25,
    hook: 'Reach the right people on Instagram and Facebook without wasting budget.',
    idea: [
      'A Meta ad account has three layers. The campaign holds the objective, the one result you want: sales, leads or messages. The ad set holds the audience, budget and where ads appear. The ad holds the creative: the picture, video and words.',
      'Meta then shows your ad to the people most likely to do what you asked. That is why the objective matters most: pick the wrong one and even a great ad reaches the wrong people.',
    ],
    note: 'A good ad speaks to one person, not everyone.',
    terms: ['campaign-objective', 'audience', 'creative', 'lookalike-audience', 'retargeting', 'frequency'],
    tip: 'Test two ads at once and change only one thing, such as the first line. After a few days keep the winner. Changing everything teaches you nothing.',
    mistake: 'Boosting a post without choosing an audience. It spends quickly and reaches people who will never buy.',
    task: {
      title: 'Plan an ad for a local shop',
      brief:
        'Pick a local shop you know. Write the objective you would choose, the audience (age, area, one interest) and a 20-word ad. No tools needed.',
      placeholder: 'Objective: … Audience: … Ad: …',
      after:
        'Check three things: the objective matches the goal (leads for a coaching class, not “reach”), the audience is narrow enough to picture, and the ad speaks to one person.',
    },
  },
  {
    slug: 'google-ads',
    minutes: 25,
    hook: 'Catch people at the moment they are already searching for what you sell.',
    idea: [
      'Google Ads works on intent. Someone types what they want, and your ad can appear next to the results. You choose the keywords you want to show up for, and in a search campaign you pay when someone clicks.',
      'Google also looks at how relevant your ad and landing page are to the search. A matching ad and page can earn a better position at a lower cost than a vague one. The match type you choose (broad, phrase or exact) decides how closely a search has to match your keyword.',
    ],
    note: 'Searchers already want something. Your job is to be the clear answer.',
    terms: ['search-campaign', 'keywords', 'exact-match', 'phrase-match', 'landing-page', 'ad-extensions'],
    tip: 'Add negative keywords such as “free” or “jobs” to stop paying for clicks that will never buy.',
    mistake: 'Sending every click to the homepage. Send people to a page that matches the ad they clicked.',
    task: {
      title: 'Choose keywords for one product',
      brief:
        'Pick a product or service. Write five things a person might type into Google to find it. Mark the ones that show they are ready to buy (words like “buy”, “price”, “near me”). Then write one headline of up to 30 characters.',
      placeholder: 'Keywords: … Ready to buy: … Headline: …',
      after:
        'Ready-to-buy searches usually carry a price, a place or a buying word. Start your budget with those, and keep curious “how to” searches for later.',
    },
  },
  {
    slug: 'seo-aeo',
    minutes: 25,
    hook: 'Earn free visits by being the best answer to what people search, and to what AI assistants are asked.',
    idea: [
      'SEO earns visits from search results without paying for each click. It rests on three things: content that answers what people are really looking for, a site that loads fast and is easy to read, and links from other sites that show you can be trusted.',
      'AEO, answer engine optimisation, shapes your content so search and AI assistants can quote it. Write the question as a heading, then answer it clearly in the first two sentences, and add detail below.',
    ],
    note: 'Write for the person first. Search engines follow people.',
    terms: ['seo', 'serp', 'backlink', 'long-tail-keyword', 'internal-linking', 'aeo'],
    tip: 'Write the question as a heading and answer it in the first two sentences. People and answer engines both stop reading after the first clear answer.',
    mistake: 'Repeating a keyword again and again. It reads badly and doesn’t help. Cover the topic in natural language.',
    task: {
      title: 'Write one answer-ready section',
      brief:
        'Pick a question a customer really asks, for example “How long does it take to learn Excel?”. Write it as a heading, answer it in about 40 words, and add one related question underneath.',
      placeholder: 'Heading: … Answer: … Related question: …',
      after:
        'A good answer gives the main point first, with no warm-up. If someone read only your first two sentences, they should still know the answer.',
    },
  },
  {
    slug: 'analytics',
    minutes: 25,
    hook: 'Numbers show what happened, so you know what to do next.',
    idea: [
      'Analytics tells you what happened after someone met your marketing. In GA4 the basic unit is the event, such as a page view or a click. A conversion is an event that matters to your business: a purchase, a sign-up, a call.',
      'To judge a campaign, follow the path: how many saw it, how many clicked, how many converted, and what each result cost. A UTM tag on a link tells you which post or ad brought each visit.',
    ],
    note: 'Measure what changes money, not what looks good.',
    terms: ['kpi', 'event', 'conversion-rate', 'utm', 'cac', 'roas'],
    tip: 'Tag every link you share with a UTM, so you can tell which post, ad or message brought the visit.',
    mistake: 'Counting likes and views as success. They are easy to see but they rarely decide whether the business grows.',
    task: {
      title: 'Work out three numbers',
      brief:
        'A tuition ad was seen by 2,000 people. 80 clicked, 8 sent an enquiry, and 2 joined. The ad cost ₹4,000. Work out the click-through rate, the share of clickers who enquired, and the cost for each student who joined.',
      placeholder: 'Click-through rate: … Enquiry rate: … Cost per student: …',
      after:
        'Click-through rate is 80 ÷ 2,000 = 4%. Enquiry rate is 8 ÷ 80 = 10%. Cost per student is ₹4,000 ÷ 2 = ₹2,000. That last number is your CAC for this ad.',
    },
  },
  {
    slug: 'content-marketing',
    minutes: 25,
    hook: 'Be useful first. People buy from those who helped them already.',
    idea: [
      'Content marketing earns attention by being useful before asking for a sale: a short video, a guide, a post that solves a small problem. A content strategy decides who you are helping, which themes you will return to, and what you want people to do next.',
      'Make one good idea go a long way. A single piece can become a reel, a post and a newsletter: this is repurposing. And the first line matters most. A strong hook promises a result or a surprise, and the rest has to deliver it.',
    ],
    note: 'One idea, many formats. Don’t start from zero each day.',
    terms: ['content-marketing', 'content-strategy', 'content-calendar', 'hook', 'copywriting', 'repurposing'],
    tip: 'Cut everything before the interesting part. Open with the result, the surprise or the problem.',
    mistake: 'Posting random things every day with no theme. People can’t tell what you are for, so they don’t follow.',
    task: {
      title: 'Write three hooks, pick one',
      brief:
        'Choose a topic your audience cares about, such as “save ₹1,000 a month”. Write three different opening lines for a reel or post, then circle the one you would use and say why.',
      placeholder: 'Hook 1: … Hook 2: … Hook 3: … I would use: … because …',
      after:
        'The strongest hooks name a result or a problem in the first few words. Weak ones start with “Hi guys” or explain who you are.',
    },
  },
  {
    slug: 'marketing-automation-ai',
    minutes: 25,
    hook: 'Let tools do the repeated work, and use AI as a fast first draft, not the final word.',
    idea: [
      'Marketing automation does repeated steps for you. A trigger, such as someone filling in a form, starts a workflow: send a welcome message, tag the lead, remind your team. Lead scoring adds points for actions so you know who to call first.',
      'AI tools can draft, summarise and brainstorm quickly. You get a better result when your prompt gives a role, the audience, the task and the format you want. But a person should always read the result before it goes out.',
    ],
    note: 'Automate the boring step. Keep the human judgement.',
    terms: ['marketing-automation', 'trigger', 'workflow', 'lead-scoring', 'ai-prompt', 'chatbot'],
    tip: 'Start with one boring task you repeat every week. Write it as “When X happens, do Y”, then automate only that.',
    mistake: 'Publishing AI writing without reading it. Facts, names and tone can all be wrong.',
    task: {
      title: 'Write a prompt, and a checklist',
      brief:
        'Write a prompt asking an AI tool for five Instagram captions for a local bakery. Include the role, the audience, the tone and the format. Then list three things you would check before posting.',
      placeholder: 'Prompt: … Before posting I would check: …',
      after:
        'A strong prompt names who the AI should act as, who the captions are for, the tone and how many. Good checks: facts and prices, spelling of names, and whether it sounds like the bakery.',
    },
  },
]

export const topicChapter = (slug: string) => TOPIC_CHAPTERS.find((t) => t.slug === slug)

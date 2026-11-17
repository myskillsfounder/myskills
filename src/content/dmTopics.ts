/**
 * The Digital Marketing topic pages (Paul, 17 Nov 2026: "a dashboard for topics
 * where there is a topic, vocabulary, a small task, a tip and few more things,
 * like a whole textbook page"; then lesson-page references with check-ins and
 * reinforcement). One chapter per skill track in lib/skillTracks.ts, same slug.
 * The key terms are picked from lib/vocabulary.ts by id, so a term learned here
 * counts toward the Vocabulary Builder and the Foundation unlock.
 *
 * Plain, careful wording: Paul reads and approves this copy. The worked examples
 * are imagined ("Imagine a …"), never presented as real cases or real results.
 */

/** A check-in question: a short scenario, four options, and the reason after. */
export interface CheckQuestion {
  id: string
  scenario: string
  question: string
  options: [string, string, string, string]
  /** index into options */
  answer: number
  hint: string
  /** shown after the answer is locked, right or wrong */
  why: string
}

export interface TopicChapter {
  /** matches a slug in lib/skillTracks.ts */
  slug: string
  /** about how long the whole topic takes, in minutes */
  minutes: number
  /** one line under the title */
  hook: string
  /** the big idea: short paragraphs, plain words */
  idea: string[]
  /** three short reasons it matters */
  why: [string, string, string]
  /** the idea again, as an everyday picture */
  simple: string
  /** a common wrong belief, and what is true */
  myth: { wrong: string; right: string }
  /** an imagined worked example */
  example: { title: string; body: string }
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
  /** check-in questions, when this topic has them yet */
  checks?: CheckQuestion[]
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
    why: [
      'You build what people actually want',
      'Money doesn’t go on ads nobody needs',
      'Every later choice gets easier: who, what, where',
    ],
    simple:
      'A tailor who knows her customers work in offices doesn’t shout “we stitch clothes”. She offers evening fittings and quick alterations. Same shop, new way of seeing the customer.',
    myth: {
      wrong: 'Marketing means advertising: making noise so people buy.',
      right: 'Marketing starts before the ad. Understand the customer, shape the offer, then tell people.',
    },
    example: {
      title: 'A tuition centre',
      body: 'Imagine a tuition centre that advertises “best teachers” and gets few enquiries. After talking to parents it finds their real worry is Class 10 maths. It rewrites the offer as “a 90-day plan for your child’s Class 10 maths”. Same centre, but now the message speaks to a worry parents already have.',
    },
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
    checks: [
      {
        id: 'mf-1',
        scenario: 'A new tea stall owner says, “Everyone drinks tea, so my customers are everyone.”',
        question: 'What is the problem with this?',
        options: [
          'Tea is too common a product to market',
          'Customers shouldn’t be described at all',
          'Marketing only works for big brands',
          '“Everyone” isn’t a target audience, so the message ends up speaking to no one',
        ],
        answer: 3,
        hint: 'Can you picture one real person when you say “everyone”?',
        why: 'A target audience is a specific group you can picture: their age, place and need. An ad written for everyone has nothing particular to say, so it reaches no one in particular.',
      },
      {
        id: 'mf-2',
        scenario: 'Two tailors advertise. One says “We stitch clothes.” The other says “Evening fittings for busy office workers.”',
        question: 'What is the second tailor doing better?',
        options: [
          'Speaking to a specific customer and a need they have',
          'Charging a lower price',
          'Using more words',
          'Advertising in more places',
        ],
        answer: 0,
        hint: 'Which message could only be true for one kind of customer?',
        why: 'The second message names who it is for and the problem it solves, which gives customers a reason to choose it. The first could describe any tailor.',
      },
      {
        id: 'mf-3',
        scenario: 'A bakery adds eggless flavours and a gift box to what it sells.',
        question: 'Which of the 4 Ps has it changed?',
        options: [
          'Price',
          'Promotion',
          'Product',
          'Place',
        ],
        answer: 2,
        hint: 'The 4 Ps are Product, Price, Place and Promotion. Which one is about what you offer?',
        why: 'Product covers what you offer: the range, quality, features and packaging. Price is what it costs, Place is where and how people can buy, and Promotion is how you tell people.',
      },
      {
        id: 'mf-4',
        scenario: 'Many people see a coaching class’s ad, but very few send an enquiry.',
        question: 'Where is the problem in the marketing funnel?',
        options: [
          'At the top: nobody knows the class exists',
          'Between seeing the ad and enquiring: the offer isn’t convincing people to act',
          'After joining: the class can’t keep its students',
          'Nowhere: the funnel is working',
        ],
        answer: 1,
        hint: 'Many people got to the top of the funnel. What is happening to them after that?',
        why: 'People saw the ad, so awareness is working. The drop happens before they enquire, which points to the middle of the funnel: the message or offer isn’t giving them a reason to act.',
      },
    ],
  },
  {
    slug: 'market-research',
    minutes: 25,
    hook: 'Replace guessing with evidence, using free tools and a few honest conversations.',
    idea: [
      'Market research is how you learn what customers actually think and do. Primary research is when you ask people yourself: a short survey, an interview, watching someone use the product. Secondary research is using what others already published: reviews, reports, search suggestions.',
      'You don’t need a budget to start. Talk to five real customers, read competitors’ reviews, and notice what people type into a search box. Look for the same complaint appearing again and again: that is a customer pain point.',
    ],
    why: [
      'You learn what customers really think, not what you assume',
      'You find gaps your competitors miss',
      'You spend on ideas that already have some proof',
    ],
    simple:
      'Before opening a juice shop, you stand outside a college at lunchtime and count how many people walk past with a bottle. That small observation is research.',
    myth: {
      wrong: 'Research needs a big budget and long reports.',
      right: 'Five honest conversations and a few hours reading reviews can show you the pattern.',
    },
    example: {
      title: 'An eggless cake baker',
      body: 'Imagine a home baker thinking of selling eggless cakes. She reads twenty reviews of nearby bakeries and sees “not fresh” and “late delivery” again and again. Now she knows what to promise: baked the same day, delivered on time.',
    },
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
    checks: [
      {
        id: 'mr-1',
        scenario: 'You read twenty customer reviews of nearby bakeries to learn what people want.',
        question: 'What kind of research is this?',
        options: [
          'Primary research',
          'Secondary research',
          'A focus group',
          'A survey',
        ],
        answer: 1,
        hint: 'Did you ask anyone yourself, or use something already published?',
        why: 'Secondary research uses information that already exists, such as reviews, reports and search suggestions. Primary research is when you ask people yourself, for example in a survey or an interview.',
      },
      {
        id: 'mr-2',
        scenario: 'You are writing a question to ask customers about your delivery.',
        question: 'Which question is least likely to give a biased answer?',
        options: [
          'Don’t you love our fast delivery?',
          'What was the most annoying part of your last order?',
          'You’d recommend us, right?',
          'How would you rate our excellent service?',
        ],
        answer: 1,
        hint: 'Which questions already suggest the answer they want?',
        why: 'Leading questions hint at the answer you hope for, so people answer politely. An open question about what was annoying invites honest detail you can act on.',
      },
      {
        id: 'mr-3',
        scenario: 'In ten interviews, seven parents say tuition centres don’t tell them how their child is progressing.',
        question: 'What is this?',
        options: [
          'A one-off complaint you can ignore',
          'A pricing problem',
          'A customer pain point, because many people repeat it',
          'Proof that the centres are perfect',
        ],
        answer: 2,
        hint: 'What does it tell you when the same complaint comes up again and again?',
        why: 'A problem that many customers repeat is a customer pain point. It shows where a better offer or message can win, for example a centre that sends a weekly progress note.',
      },
      {
        id: 'mr-4',
        scenario: 'Someone searches “best budget laptop for students under 40000”.',
        question: 'What does this search tell you?',
        options: [
          'They want the company’s history',
          'They are comparing options and are close to buying',
          'They are looking for a job',
          'They want a free download',
        ],
        answer: 1,
        hint: 'Look at the words “best”, “budget” and “under 40000”.',
        why: 'Words like “best”, a budget and a price limit show someone choosing between options and nearly ready to buy. That is search intent, and it tells you what content or ad to show them.',
      },
    ],
  },
  {
    slug: 'meta-ads',
    minutes: 25,
    hook: 'Reach the right people on Instagram and Facebook without wasting budget.',
    idea: [
      'A Meta ad account has three layers. The campaign holds the objective, the one result you want: sales, leads or messages. The ad set holds the audience, budget and where ads appear. The ad holds the creative: the picture, video and words.',
      'Meta then shows your ad to the people most likely to do what you asked. That is why the objective matters most: pick the wrong one and even a great ad reaches the wrong people.',
    ],
    why: [
      'You reach people by age, place and interest, not by luck',
      'A small budget can still test an idea',
      'You see quickly which message works',
    ],
    simple:
      'Think of Meta as a helper who does exactly what you ask. Ask for clicks and it finds people who click. Ask for enquiries and it looks for people who send them.',
    myth: {
      wrong: 'More reach means better results.',
      right: 'Reach only counts people who saw the ad. Results come from the right people doing the action you asked for.',
    },
    example: {
      title: 'A coaching class',
      body: 'Imagine a coaching class that wants enquiries from parents of Class 9 students in one town. It picks the Leads objective, an audience of parents aged 28–45 within 10 km, and one ad whose first line is about board exam preparation. The audience is narrow on purpose.',
    },
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
    checks: [
      {
        id: 'meta-1',
        scenario: 'A coaching class wants parents to fill in an enquiry form.',
        question: 'Which campaign objective fits best?',
        options: ['Awareness', 'Leads', 'Video views', 'Reach'],
        answer: 1,
        hint: 'Which result do you want: people who saw it, people who watched it, or people who filled in the form?',
        why: 'Meta shows your ad to people it expects to take the action you chose. Leads finds people likely to submit a form. Awareness and Reach only count who saw the ad.',
      },
      {
        id: 'meta-2',
        scenario: 'You are setting up a new campaign and need to choose who sees the ad, and the daily budget.',
        question: 'Where do you set the audience and budget?',
        options: ['In the campaign', 'In the ad set', 'In the ad', 'In the Meta Pixel'],
        answer: 1,
        hint: 'The campaign holds the objective. The ad holds the picture and words. What is left?',
        why: 'The ad set holds the audience, the budget and where the ads appear. The campaign holds the objective and the ad holds the creative.',
      },
      {
        id: 'meta-3',
        scenario: 'A boutique’s ad has now been shown to the same people nine times, and clicks are falling.',
        question: 'Which measure shows this problem?',
        options: ['Frequency', 'Lookalike audience', 'Placement', 'Campaign objective'],
        answer: 0,
        hint: 'Which word means how many times each person has seen the ad?',
        why: 'Frequency is the average number of times each person saw your ad. When it climbs and results fall, people are tired of the ad. Try a fresh creative or a wider audience.',
      },
      {
        id: 'meta-4',
        scenario: 'Between Ad A and Ad B you changed the picture, the headline and the price. Ad B gets more clicks.',
        question: 'What have you learned?',
        options: [
          'The new picture works better',
          'The new headline works better',
          'The lower price works better',
          'Very little, because you can’t tell which change caused it',
        ],
        answer: 3,
        hint: 'How many things were different between the two ads?',
        why: 'When several things change at once, you can’t tell which one made the difference. Change one thing at a time, so the result teaches you something.',
      },
    ],
  },
  {
    slug: 'google-ads',
    minutes: 25,
    hook: 'Catch people at the moment they are already searching for what you sell.',
    idea: [
      'Google Ads works on intent. Someone types what they want, and your ad can appear next to the results. You choose the keywords you want to show up for, and in a search campaign you pay when someone clicks.',
      'Google also looks at how relevant your ad and landing page are to the search. A matching ad and page can earn a better position at a lower cost than a vague one. The match type you choose (broad, phrase or exact) decides how closely a search has to match your keyword.',
    ],
    why: [
      'You show up when people are already looking',
      'In a search campaign you pay when someone clicks, so you can start small',
      'You can see which searches bring customers',
    ],
    simple:
      'Google Ads is like standing at the door of a shop at the moment someone asks, “Where can I buy this?”, and being the first to answer.',
    myth: {
      wrong: 'The highest bid always wins the top spot.',
      right: 'Google also weighs how relevant your ad and page are, so a better match can win at a lower price.',
    },
    example: {
      title: 'A wedding photographer',
      body: 'Imagine a wedding photographer in Kochi. She bids on “wedding photographer Kochi” and “candid wedding photography packages”, adds “free” and “jobs” as negative keywords, and sends every click to a page showing her wedding work and a price range.',
    },
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
    checks: [
      {
        id: 'google-1',
        scenario: 'You sell running shoes and can only afford to bid on one search.',
        question: 'Which search shows the person is closest to buying?',
        options: [
          'history of running shoes',
          'how are running shoes made',
          'running shoes',
          'buy running shoes size 9 near me',
        ],
        answer: 3,
        hint: 'Look for a buying word, a size or a place.',
        why: 'A buying word, a size and a place all show the person is ready to purchase. “History of” and “how are … made” are curious searches, and “running shoes” alone could mean anything.',
      },
      {
        id: 'google-2',
        scenario: 'You sell a paid resume builder. Many people click your ad after searching “free resume template” and leave at once.',
        question: 'What is the best fix?',
        options: [
          'Raise your bids',
          'Add “free” as a negative keyword',
          'Switch every keyword to broad match',
          'Remove the landing page',
        ],
        answer: 1,
        hint: 'How do you tell Google not to show your ad for a certain word?',
        why: 'A negative keyword stops your ad from showing on searches that contain that word, so you stop paying for clicks that won’t buy. Broad match would show the ad for even more searches.',
      },
      {
        id: 'google-3',
        scenario: 'You want the tightest control over which searches show your ad.',
        question: 'Which match type should you use?',
        options: ['Broad match', 'Phrase match', 'Exact match', 'Display match'],
        answer: 2,
        hint: 'One match type is the strictest, and one of the four is not a real match type.',
        why: 'Exact match is the strictest, so the ad shows only for searches that mean the same as your keyword. Broad is the loosest. Display is not a match type: Display is a campaign type.',
      },
      {
        id: 'google-4',
        scenario: 'Your ad says “50% off wedding photography”, but the click lands on a homepage with a general slideshow and no offer.',
        question: 'What is most likely to happen?',
        options: [
          'Visitors leave, so you waste spend and may lower your ad relevance',
          'Google rewards you for the extra clicks',
          'Nothing changes, because people will search the site',
          'The ad gets a better position',
        ],
        answer: 0,
        hint: 'Think about what the person expected when they clicked.',
        why: 'People click expecting the offer in the ad. When the page doesn’t match, many leave, you pay for the click, and relevance can drop. Send each ad to a page that matches it.',
      },
    ],
  },
  {
    slug: 'seo-aeo',
    minutes: 25,
    hook: 'Earn free visits by being the best answer to what people search, and to what AI assistants are asked.',
    idea: [
      'SEO earns visits from search results without paying for each click. It rests on three things: content that answers what people are really looking for, a site that loads fast and is easy to read, and links from other sites that show you can be trusted.',
      'AEO, answer engine optimisation, shapes your content so search and AI assistants can quote it. Write the question as a heading, then answer it clearly in the first two sentences, and add detail below.',
    ],
    why: [
      'Visits keep coming without paying for each click',
      'People trust results that earned their place',
      'Clear answers can be quoted by AI assistants',
    ],
    simple:
      'SEO is making your shop easy to find and worth visiting: a clear sign, good products, and neighbours who recommend you. Those recommendations are links.',
    myth: {
      wrong: 'SEO is a trick to fool Google.',
      right: 'SEO is making your page the clearest, most useful answer. Tricks stop working. Useful pages last.',
    },
    example: {
      title: 'A spice seller',
      body: 'Imagine a Kerala spice seller who writes a page called “How to store cardamom so it stays fresh”. A short answer comes first, a few tips follow, and a link leads to her cardamom product page.',
    },
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
    checks: [
      {
        id: 'se-1',
        scenario: 'A popular food blogger links to a local bakery’s blog in an article.',
        question: 'What is this link called, and why does it help?',
        options: [
          'An internal link: it moves visitors around your own site',
          'A backlink: other sites linking to you signal that you can be trusted',
          'A UTM: it tags where visits come from',
          'A sitemap: it lists all your pages',
        ],
        answer: 1,
        hint: 'Does the link come from your own site, or from someone else’s?',
        why: 'A link from another website to yours is a backlink. Search engines treat good ones as a sign that others find your page useful. Links between your own pages are internal links.',
      },
      {
        id: 'se-2',
        scenario: 'You sell running shoes and are choosing a keyword to write a page for.',
        question: 'Why might “lightweight running shoes for flat feet” beat “shoes”?',
        options: [
          'Shorter keywords always rank better',
          'It is more specific, so there are fewer rivals and the intent is clearer',
          'Search engines only read long keywords',
          'It contains more letters',
        ],
        answer: 1,
        hint: 'Which search tells you more about what the person wants?',
        why: 'A long-tail keyword is a longer, more specific search. Fewer pages compete for it and the person usually knows what they want, so a matching page is more likely to be the answer.',
      },
      {
        id: 'se-3',
        scenario: 'A page opens with three paragraphs of history before it answers “How long does a passport take?”.',
        question: 'What would help search and AI assistants quote the answer?',
        options: [
          'Make the history longer',
          'Remove the heading',
          'Put the answer in the first two sentences, under a heading that is the question',
          'Repeat the question ten times',
        ],
        answer: 2,
        hint: 'Where would you look first for a quick answer?',
        why: 'Answer engines and busy readers want the answer straight away. Write the question as a heading, answer it in the first two sentences, then add the detail below.',
      },
      {
        id: 'se-4',
        scenario: 'A page repeats the phrase “best cheap hotels” forty times.',
        question: 'What is wrong with this?',
        options: [
          'Nothing: more repeats always rank higher',
          'It slows the page down',
          'It reads badly and doesn’t make the page more useful. Cover the topic naturally instead',
          'Search engines ignore all text',
        ],
        answer: 2,
        hint: 'Would you enjoy reading a page like that?',
        why: 'Repeating a keyword again and again is called keyword stuffing. It makes the page worse for people, and search engines aim to reward useful pages, so it doesn’t help.',
      },
    ],
  },
  {
    slug: 'analytics',
    minutes: 25,
    hook: 'Numbers show what happened, so you know what to do next.',
    idea: [
      'Analytics tells you what happened after someone met your marketing. In GA4 the basic unit is the event, such as a page view or a click. A conversion is an event that matters to your business: a purchase, a sign-up, a call.',
      'To judge a campaign, follow the path: how many saw it, how many clicked, how many converted, and what each result cost. A UTM tag on a link tells you which post or ad brought each visit.',
    ],
    why: [
      'You stop guessing which post or ad worked',
      'You can compare what each channel costs',
      'You spot problems early, such as a page people leave',
    ],
    simple: 'Analytics is the shop’s door counter and till roll: how many walked in, what they looked at, and who bought.',
    myth: {
      wrong: 'More followers and likes mean the business is doing well.',
      right: 'Likes are a start. What matters are the numbers that lead to money: enquiries, sales and what each one costs.',
    },
    example: {
      title: 'A bakery’s links',
      body: 'Imagine a bakery shares the same offer on Instagram, WhatsApp and a flyer QR code, each link with its own UTM tag. After a week the bakery can see which one brought visitors who actually ordered, and put next week’s effort there.',
    },
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
    checks: [
      {
        id: 'an-1',
        scenario: 'A bakery wants to know how well its website is working.',
        question: 'Which is most likely to be a conversion for a bakery?',
        options: [
          'Someone viewing the home page',
          'Someone scrolling down a page',
          'A customer placing an order',
          'Someone clicking the logo',
        ],
        answer: 2,
        hint: 'A conversion is an event that matters to the business.',
        why: 'A conversion is an action that matters to the business: here, an order. Page views and scrolls are events, but they are not the result the bakery wants.',
      },
      {
        id: 'an-2',
        scenario: 'You share the same offer link on Instagram and WhatsApp and want to know which brought orders.',
        question: 'What do you add to each link?',
        options: [
          'A different UTM tag for each',
          'More hashtags',
          'A longer caption',
          'Nothing: analytics will work it out',
        ],
        answer: 0,
        hint: 'How can a link carry a label that tells you where the visit came from?',
        why: 'A UTM tag is a label added to a link that records its source. Give each link its own tag and your analytics can show which one brought the visitors who ordered.',
      },
      {
        id: 'an-3',
        scenario: 'An ad was seen by 5,000 people and 100 of them clicked.',
        question: 'What is the click-through rate?',
        options: [
          '0.2%',
          '2%',
          '20%',
          '5%',
        ],
        answer: 1,
        hint: 'Click-through rate is clicks divided by the number who saw it.',
        why: '100 clicks divided by 5,000 views is 0.02, which is 2%. Click-through rate shows how many of the people who saw the ad were interested enough to click.',
      },
      {
        id: 'an-4',
        scenario: 'You are deciding whether to spend more on an ad.',
        question: 'Which number is most useful for that decision?',
        options: [
          'Likes on the post',
          'How many people saw it',
          'Comments on the post',
          'The cost for each enquiry or sale',
        ],
        answer: 3,
        hint: 'Which number tells you whether the money is working?',
        why: 'The cost for each enquiry or sale shows what you pay for a result that matters. Likes, views and comments are easy to see, but they don’t tell you if the ad is worth its price.',
      },
    ],
  },
  {
    slug: 'content-marketing',
    minutes: 25,
    hook: 'Be useful first. People buy from those who helped them already.',
    idea: [
      'Content marketing earns attention by being useful before asking for a sale: a short video, a guide, a post that solves a small problem. A content strategy decides who you are helping, which themes you will return to, and what you want people to do next.',
      'Make one good idea go a long way. A single piece can become a reel, a post and a newsletter: this is repurposing. And the first line matters most. A strong hook promises a result or a surprise, and the rest has to deliver it.',
    ],
    why: [
      'People trust those who help before they sell',
      'One idea can feed many posts',
      'Good content keeps working after you post it',
    ],
    simple:
      'A chef who shares a free recipe on Sunday gets customers on Monday. Giving first makes selling feel natural.',
    myth: {
      wrong: 'Post every day and followers will come.',
      right: 'Consistency matters, but a clear theme and a strong first line matter more than daily volume.',
    },
    example: {
      title: 'A personal trainer',
      body: 'Imagine a personal trainer who records one 3-minute video called “3 squat mistakes”. It becomes a reel, three captions for posts, and one line in her weekly newsletter. One idea, many formats.',
    },
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
    checks: [
      {
        id: 'cm-1',
        scenario: 'You are writing the first line of a reel about saving money.',
        question: 'Which opening line is the strongest hook?',
        options: [
          'Hi guys, welcome back to my channel',
          'Today I want to talk about money',
          'I saved ₹1,000 a month by changing one habit',
          'Please like and subscribe',
        ],
        answer: 2,
        hint: 'Which line gives a reason to keep watching?',
        why: 'A strong hook promises a result or a surprise in the first words. “I saved ₹1,000 a month by changing one habit” does both. Greetings and requests give people no reason to stay.',
      },
      {
        id: 'cm-2',
        scenario: 'A personal trainer records one 3-minute video called “3 squat mistakes”.',
        question: 'What is the smartest next step?',
        options: [
          'Delete it and start a different topic',
          'Turn it into a reel, a few post captions and a newsletter line',
          'Post it once and never use it again',
          'Wait until she has more followers',
        ],
        answer: 1,
        hint: 'How can one idea reach people in more than one format?',
        why: 'Repurposing means making one good idea work in many formats. One video can become a reel, several captions and a newsletter line, so you don’t start from zero each time.',
      },
      {
        id: 'cm-3',
        scenario: 'A bakery posts a random mix of things every day, but its followers aren’t growing.',
        question: 'What is the best fix?',
        options: [
          'Pick two or three themes to return to, and say who they help',
          'Post twice as much',
          'Delete the old posts',
          'Buy followers',
        ],
        answer: 0,
        hint: 'Can a new visitor tell what the bakery is for?',
        why: 'Without a theme, people can’t tell what you are for. A content strategy picks who you are helping and which themes you will return to, so followers know what to expect.',
      },
      {
        id: 'cm-4',
        scenario: 'A language coach wants to follow the idea of being useful before selling.',
        question: 'Which approach does that?',
        options: [
          'Posting only discounts',
          'Only posting about her own awards',
          'Sending the same sales message every day',
          'Sharing a free guide that solves a small problem, then mentioning her classes',
        ],
        answer: 3,
        hint: 'Who benefits first from the post: the coach, or the reader?',
        why: 'Content marketing earns attention by helping first. A free guide solves a real problem, builds trust, and makes a mention of the classes feel natural rather than pushy.',
      },
    ],
  },
  {
    slug: 'marketing-automation-ai',
    minutes: 25,
    hook: 'Let tools do the repeated work, and use AI as a fast first draft, not the final word.',
    idea: [
      'Marketing automation does repeated steps for you. A trigger, such as someone filling in a form, starts a workflow: send a welcome message, tag the lead, remind your team. Lead scoring adds points for actions so you know who to call first.',
      'AI tools can draft, summarise and brainstorm quickly. You get a better result when your prompt gives a role, the audience, the task and the format you want. But a person should always read the result before it goes out.',
    ],
    why: [
      'Replies and reminders go out on time, even at night',
      'Your team spends time on people, not copy-pasting',
      'AI gives you a fast first draft to improve',
    ],
    simple:
      'Automation is a diary that acts on its own. When a form comes in, it sends the welcome message and tells you. You decide the rule once.',
    myth: {
      wrong: 'AI can run your marketing by itself.',
      right: 'AI drafts quickly, but a person decides what is true, kind and right for the brand.',
    },
    example: {
      title: 'A language class',
      body: 'Imagine a language class. When someone fills in the enquiry form, a workflow sends a WhatsApp welcome with batch timings, tags them as a new lead, and reminds the counsellor to call within two hours.',
    },
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
    checks: [
      {
        id: 'ma-1',
        scenario: 'When someone fills in an enquiry form, a welcome message is sent to them automatically.',
        question: 'What is the form being filled in called?',
        options: [
          'A workflow',
          'A trigger',
          'A lead score',
          'A prompt',
        ],
        answer: 1,
        hint: 'It is the event that starts the automation.',
        why: 'A trigger is the event that starts an automation, such as a form being submitted. The steps that follow, like sending the message and tagging the lead, are the workflow.',
      },
      {
        id: 'ma-2',
        scenario: 'Priya opened five emails and visited the pricing page twice. Rahul opened one email.',
        question: 'How does lead scoring help?',
        options: [
          'It gives Priya more points, so the team knows to call her first',
          'It sends both the same email',
          'It deletes Rahul’s details',
          'It guarantees Priya will buy',
        ],
        answer: 0,
        hint: 'Which of them looks more interested, and how could a tool show that?',
        why: 'Lead scoring adds points for actions such as opening emails and visiting the pricing page. A higher score tells your team who is most interested, so they call that person first.',
      },
      {
        id: 'ma-3',
        scenario: 'You want an AI tool to write Instagram captions for a local bakery.',
        question: 'Which prompt is likely to give the best result?',
        options: [
          'Write captions',
          'Bakery posts please',
          'Act as a social media writer for a local bakery. Write five Instagram captions for working mums, in a friendly tone, under 25 words each',
          'Make it go viral',
        ],
        answer: 2,
        hint: 'A good prompt names a role, the audience, the task and the format.',
        why: 'A strong prompt says who the AI should act as, who the captions are for, the tone, and how many and how long. Vague prompts get vague answers.',
      },
      {
        id: 'ma-4',
        scenario: 'An AI tool writes an ad saying a bakery has “a 20-year history”, but the bakery opened last year.',
        question: 'What should have happened before posting?',
        options: [
          'A person should have checked the facts',
          'Nothing: AI is always right',
          'The ad should have been posted twice',
          'The tool should have been given a shorter prompt',
        ],
        answer: 0,
        hint: 'Who is responsible for what goes out under the bakery’s name?',
        why: 'AI can write fluent text that is wrong. A person must read the result and check facts, names and tone before it goes out.',
      },
    ],
  },
]

export const topicChapter = (slug: string) => TOPIC_CHAPTERS.find((t) => t.slug === slug)

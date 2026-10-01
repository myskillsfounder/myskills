-- Search titles and descriptions for the two blog posts that already show up
-- in Google a lot but rarely get clicked (Search Console, Jul-Sep 2026):
--   "How technology has changed education"  1,079 impressions, 6 clicks
--   "Why some people learn faster"            603 impressions, 10 clicks
--
-- The title is the blue link in the result and the description is the text
-- under it, so they are what a searcher decides on. The post's address (slug)
-- does not change, so nothing that links to it breaks. The title is also the
-- heading on the post itself.
--
-- Run once in the Supabase SQL editor, then deploy (the build writes the new
-- titles into the pages Google reads). Safe to re-run. To go back, set the old
-- values, which are kept in the comments.

-- was: 'How Technology Has Changed Education For Last 25 Years .'
-- was: 'Technology has not simply digitized education—it has fundamentally changed who can learn, where learning happens, how knowledge is accessed, and how skills are developed.'
update public.blog_posts
   set title = 'How Technology Has Changed Education in the Last 25 Years',
       description = 'From the early internet to video, smartphones and AI: a clear timeline of how technology changed education since 2000, and the one thing about learning it did not change.',
       updated_at = now()
 where slug = 'how-technology-has-changed-education-for-last-25-years';

-- was: 'Why Some People Learn Faster: The Psychology of Effective Learning'
-- was: 'What cognitive psychology, learning science, and educational research reveal about acquiring new skills more effectively.'
update public.blog_posts
   set title = 'Why Do Some People Learn Faster Than Others? The Psychology Explained',
       description = 'Fast learners are not born that way. Here is what psychology and learning science say they do differently, with seven principles you can start using today.',
       updated_at = now()
 where slug = 'why-some-people-learn-faster-the-psychology-of-effective-learning';

-- Check:
--   select slug, title, description from public.blog_posts where status = 'published' order by published_at desc;

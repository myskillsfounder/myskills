const year = new Date().getFullYear()

const columns = [
  {
    title: 'Courses',
    links: [
      { label: 'All courses', href: '/courses' },
      { label: 'Digital Marketing', href: '/digital-marketing' },
      { label: 'Global Leadership', href: '/career-readiness' },
      { label: 'AI-Powered Entrepreneurship', href: '/entrepreneurship' },
      { label: 'AI-Powered Data Analytics', href: '/data-analytics' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Partner with us',
    links: [
      { label: 'Become a mentor', href: '/become-a-mentor' },
      { label: 'Partner your institution', href: '/become-a-partner-institution' },
      { label: 'Offer internships', href: '/become-an-internship-partner' },
      { label: 'All partnerships', href: '/community' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
]

/** `dark`: on the home page's navy, whose own colours aren't the site's light ones (like Navbar's). */
export function Footer({ dark = false }: { dark?: boolean }) {
  const t = dark
    ? { line: 'border-white/10', head: 'text-white', body: 'text-white/55', link: 'text-white/60 hover:text-white', fine: 'text-white/40' }
    : { line: 'border-ink-100', head: 'text-ink-900', body: 'text-ink-500', link: 'text-ink-500 hover:text-ink-900', fine: 'text-ink-400' }
  return (
    <footer className={`border-t ${t.line}`}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-4">
          <div>
            <p className={`text-lg font-semibold tracking-tight ${t.head}`}>
              MySkills
            </p>
            <p className={`mt-2 max-w-xs text-sm ${t.body}`}>
              Personal and professional development, powered by AI and reviewed by people.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className={`text-sm font-semibold ${t.head}`}>{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className={`text-sm transition-colors ${t.link}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={`mt-10 border-t pt-6 ${t.line}`}>
          <p className={`text-xs ${t.fine}`}>
            &copy; {year} MySkills. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

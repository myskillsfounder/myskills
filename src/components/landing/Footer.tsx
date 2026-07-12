const year = new Date().getFullYear()

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Skill tracks', href: '#skill-tracks' },
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

export function Footer() {
  return (
    <footer className="border-t border-ink-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <p className="text-lg font-semibold tracking-tight text-ink-900">
              MySkills
            </p>
            <p className="mt-2 max-w-xs text-sm text-ink-500">
              Scenario-based skill assessments for digital marketing students.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-ink-900">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-ink-500 transition-colors hover:text-ink-900"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-ink-100 pt-6">
          <p className="text-xs text-ink-400">
            &copy; {year} MySkills. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

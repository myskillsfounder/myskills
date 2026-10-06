import { PORTAL_ROLES, type PortalRequestDetails } from '@/lib/portalAccess'
import { Input, Textarea } from '@/components/ui'

/**
 * What someone is asking the team to verify them as: their role, the company or
 * institution if that applies, a phone number and a few words. Shared by the
 * sign-up page and the "request access" form a signed-in account sees.
 */
export function PortalRequestFields({
  value,
  onChange,
}: {
  value: PortalRequestDetails
  onChange: (next: PortalRequestDetails) => void
}) {
  const set = <K extends keyof PortalRequestDetails>(key: K, v: PortalRequestDetails[K]) => onChange({ ...value, [key]: v })
  const orgLabel = PORTAL_ROLES.find((r) => r.value === value.role)?.organisation

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-ink-800">
        I am…
        <select
          value={value.role}
          onChange={(e) => set('role', e.target.value as PortalRequestDetails['role'])}
          className="field mt-1.5 block w-full"
        >
          <option value="">Choose one</option>
          {PORTAL_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      {orgLabel && (
        <Input
          label={orgLabel}
          value={value.organisation}
          onChange={(e) => set('organisation', e.target.value)}
          maxLength={160}
        />
      )}

      <Input
        label="Phone"
        required={false}
        hint="Optional. Helps the team reach you while verifying."
        value={value.phone}
        onChange={(e) => set('phone', e.target.value)}
        placeholder="+91 98470 12345"
      />

      <Textarea
        label="About you"
        required={false}
        hint="Optional: a LinkedIn or website link, or anything that helps the team verify you."
        value={value.message}
        onChange={(e) => set('message', e.target.value)}
        rows={3}
        maxLength={1000}
      />
    </div>
  )
}

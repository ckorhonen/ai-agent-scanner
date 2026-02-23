import { useState } from 'react'
import type { ActionFunctionArgs, MetaFunction } from '@remix-run/cloudflare'
import { json } from '@remix-run/cloudflare'
import { useActionData, Form, Link } from '@remix-run/react'

export const meta: MetaFunction = () => [
  { title: 'Monitor Your AI Agent Readiness Score — scanner.v1be.codes' },
  { name: 'description', content: 'Get a weekly email alert when your site\'s AI agent readiness score drops. Free monitoring for one site.' },
]

type ActionData =
  | { ok: true; email: string; url: string }
  | { ok: false; error: string }

export async function action({ request, context }: ActionFunctionArgs) {
  const form = await request.formData()
  const email = String(form.get('email') ?? '').trim()
  const url   = String(form.get('url') ?? '').trim()

  if (!email || !email.includes('@')) {
    return json<ActionData>({ ok: false, error: 'Please enter a valid email address.' })
  }
  if (!url || !url.startsWith('http')) {
    return json<ActionData>({ ok: false, error: 'Please enter a valid URL (include https://).' })
  }

  try {
    // Store in KV (reuse SCAN_KV namespace with a different prefix)
    const kv = context?.cloudflare?.env?.SCAN_KV as KVNamespace | undefined
    if (kv) {
      const record = { email, url, createdAt: Date.now(), active: true }
      await kv.put(`monitor:${email}:${encodeURIComponent(url)}`, JSON.stringify(record), {
        expirationTtl: 60 * 60 * 24 * 400  // ~13 months
      })
    }

    // Send confirmation via AgentMail
    try {
      await fetch('https://api.agentmail.to/v0/inboxes/clawd.korhonen@agentmail.to/messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer am_9727b40c7776b052660a2ce9c32d03064d25edcafbc01dbf7a7c51b5daee74b7',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: [email],
          subject: '✅ AI Agent Readiness Monitor — you\'re subscribed',
          text: [
            `Hi there,`,
            ``,
            `You've signed up for weekly AI agent readiness monitoring for:`,
            `${url}`,
            ``,
            `Every week we'll scan your site and email you if the score drops by more than 5 points.`,
            ``,
            `Scan it now: https://scanner.v1be.codes/scan?url=${encodeURIComponent(url)}`,
            ``,
            `— AI Agent Readiness Scanner`,
            `https://scanner.v1be.codes`,
          ].join('\n'),
        }),
      })
    } catch { /* non-fatal */ }

    return json<ActionData>({ ok: true, email, url })
  } catch {
    return json<ActionData>({ ok: false, error: 'Something went wrong. Please try again.' })
  }
}

export default function Monitor() {
  const data = useActionData<typeof action>()
  const [submitted, setSubmitted] = useState(false)

  if (data?.ok || submitted) {
    const d = data?.ok ? data : null
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold">You&rsquo;re subscribed</h1>
          <p className="text-gray-400">
            We&rsquo;ll scan <span className="text-white font-medium">{d?.url ?? 'your site'}</span> weekly
            and email <span className="text-white font-medium">{d?.email ?? 'you'}</span> if the score drops.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition">
              ← Back to scanner
            </Link>
            {d?.url && (
              <Link
                to={`/scan?url=${encodeURIComponent(d.url)}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition"
              >
                ⚡ Scan now
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-20">

        <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 transition mb-8 inline-block">
          ← Back to scanner
        </Link>

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 text-xs px-3 py-1.5 rounded-full mb-4 border border-green-500/20 font-medium uppercase tracking-wide">
            🔔 Free · Weekly
          </div>
          <h1 className="text-3xl font-black mb-3">
            Monitor your AI agent<br />readiness score
          </h1>
          <p className="text-gray-400">
            We scan your site weekly and email you if the score drops by more than 5 points.
            Catch regressions before they affect AI agent integrations.
          </p>
        </div>

        {/* What you get */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: '📊', title: 'Weekly scan', desc: 'Every 7 days' },
            { icon: '📧', title: 'Email alert', desc: 'On score drop >5pts' },
            { icon: '💸', title: 'Free', desc: '1 site, always' },
          ].map(item => (
            <div key={item.title} className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="font-semibold text-sm text-white">{item.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <Form method="post" onSubmit={() => setSubmitted(false)} className="space-y-4">
          <div>
            <label htmlFor="url-monitor" className="block text-sm text-gray-400 mb-1.5 font-medium">
              Your website URL
            </label>
            <input
              id="url-monitor"
              name="url"
              type="url"
              required
              placeholder="https://yoursite.com"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition text-sm"
            />
          </div>

          <div>
            <label htmlFor="email-monitor" className="block text-sm text-gray-400 mb-1.5 font-medium">
              Your email
            </label>
            <input
              id="email-monitor"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition text-sm"
            />
          </div>

          {data && !data.ok && (
            <p className="text-red-400 text-sm">{data.error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition text-white text-sm"
          >
            🔔 Start monitoring — free
          </button>

          <p className="text-center text-xs text-gray-600">
            No spam. Unsubscribe any time by replying to any email.
          </p>
        </Form>

        {/* FAQ */}
        <div className="mt-12 space-y-4 text-sm text-gray-500">
          {[
            ['How often do you scan?', 'Once per week, roughly the same time each week.'],
            ['What triggers an alert?', 'A drop of 5+ points from your baseline score.'],
            ['Is this really free?', 'Yes — one site, weekly scan, forever free. Paid plans (multiple sites, daily) coming soon.'],
          ].map(([q, a]) => (
            <div key={q}>
              <p className="font-medium text-gray-400">{q}</p>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

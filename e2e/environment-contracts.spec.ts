import { expect, test } from '@playwright/test'

import { credentialsFor, qaEnvironment } from './qa-helpers'

test.describe('remote environment contracts', () => {
  test.beforeEach(() => test.skip(qaEnvironment === 'mock', 'live contract checks run against dev and prod'))

  test('[BE] public health endpoints satisfy their response contracts', async ({ request }) => {
    const health = await request.get('/api/health')
    expect(health.status()).toBe(200)
    const healthBody = await health.json()
    expect(healthBody).toMatchObject({ success: true, data: { status: 'UP' } })

    const readiness = await request.get('/api/health/ready')
    expect(readiness.status()).toBe(200)
    const readinessBody = await readiness.json()
    expect(readinessBody).toMatchObject({ status: 'UP' })
  })

  test('[FE] production metadata and static crawler files use the primary host', async ({ request }) => {
    test.skip(qaEnvironment !== 'prod', 'production-only static contract')

    const home = await request.get('/')
    expect(home.status()).toBe(200)
    const html = await home.text()
    expect(html).toContain('<link rel="canonical" href="https://www.uteum.com/"')
    expect(html).toContain('<meta property="og:url" content="https://www.uteum.com/"')

    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    expect(await robots.text()).toContain('Sitemap: https://www.uteum.com/sitemap.xml')

    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    expect(await sitemap.text()).toContain('<loc>https://www.uteum.com/</loc>')
  })

  test('[BE] dev personal schedule supports create update and cleanup', async ({ request }) => {
    test.skip(qaEnvironment !== 'dev', 'mutating API checks are forbidden outside dev')
    const credentials = credentialsFor('LEARNER')
    test.skip(!credentials, 'dev learner QA credentials are not configured')

    const login = await request.post('/api/auth/login', { data: credentials })
    expect(login.status()).toBe(200)
    const loginBody = await login.json()
    const accessToken = loginBody?.data?.accessToken
    expect(accessToken).toEqual(expect.any(String))
    const headers = { Authorization: `Bearer ${accessToken}` }
    const marker = `QA-${process.env.GITHUB_RUN_ID ?? Date.now()}`
    let scheduleId: string | undefined

    try {
      const create = await request.post('/api/users/me/schedule', {
        data: {
          endsAt: '2099-09-12T01:30:00.000Z',
          hasTime: true,
          startsAt: '2099-09-12T01:00:00.000Z',
          title: marker,
        },
        headers,
      })
      expect(create.status()).toBe(200)
      const createBody = await create.json()
      scheduleId = String(createBody?.data?.scheduleId ?? '')
      expect(scheduleId).not.toBe('')
      expect(createBody?.data).toMatchObject({ kind: 'PERSONAL', title: marker })

      const update = await request.patch(`/api/users/me/schedule/${encodeURIComponent(scheduleId)}`, {
        data: { title: `${marker}-updated` },
        headers,
      })
      expect(update.status()).toBe(200)
      expect(await update.json()).toMatchObject({ data: { title: `${marker}-updated` }, success: true })
    } finally {
      if (scheduleId) {
        const cleanup = await request.delete(`/api/users/me/schedule/${encodeURIComponent(scheduleId)}`, { headers })
        expect(cleanup.status()).toBe(200)
      }
    }
  })
})

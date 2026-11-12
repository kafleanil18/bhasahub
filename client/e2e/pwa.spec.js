import { test, expect } from '@playwright/test'

test('production PWA installs its worker and falls back offline without caching account data', async ({ page, context }) => {
  await page.goto('/')
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]')
    return (await fetch(link.href)).json()
  })
  expect(manifest.display).toBe('standalone')
  for (const icon of manifest.icons) {
    const response = await page.request.get(icon.src)
    expect(response.headers()['content-type']).toContain('image/png')
    expect(response.ok()).toBeTruthy()
  }
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })
  expect(await page.evaluate(async () => {
    const keys = await caches.keys()
    const urls = []
    for (const key of keys) for (const request of await (await caches.open(key)).keys()) urls.push(new URL(request.url).pathname)
    return urls
  })).toEqual(['/offline.html'])
  await context.setOffline(true)
  await page.goto('/courses/offline-check')
  await expect(page.getByRole('heading', { name: "You're offline" })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await context.setOffline(false)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.locator('#root')).toBeVisible()
})

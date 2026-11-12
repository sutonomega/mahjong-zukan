import { expect, test } from '@playwright/test'

test('home presents the learning course and glossary', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: '学習コース' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '図鑑をひらく' })).toBeVisible()
  await expect(page.getByRole('button', { name: /入門編/ })).toBeVisible()
})

test('lesson deep link shows tile explanations and glossary links', async ({ page }) => {
  await page.goto('/?view=course&lesson=tiles-and-hand')

  await expect(page.getByRole('heading', { level: 1, name: 'はじめての麻雀' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: '牌と手牌を知ろう' })).toBeVisible()

  const termLink = page.locator('a.course-term-link').filter({ hasText: '数牌' }).first()
  await expect(termLink).toHaveAttribute('data-tooltip', /萬子・筒子・索子/)
  await expect(termLink).toHaveAttribute('aria-label', /クリックで図鑑の詳しい説明を開く/)
})

test('quiz feedback appears only after choosing an answer', async ({ page }) => {
  await page.goto('/?view=course&lesson=tiles-and-hand')
  await page.getByRole('button', { name: 'はじめての麻雀 理解度チェック' }).click()

  const question = page.locator('.course-quiz-question').first()
  await expect(question.getByRole('status')).toHaveCount(0)
  await question.getByRole('button', { name: '東' }).click()
  await expect(question.getByRole('status')).toBeVisible()
})

test('mobile layouts fit the viewport without horizontal scrolling', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'mobile viewport only')

  for (const path of ['/', '/?view=course&lesson=tiles-and-hand']) {
    await page.goto(path)
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(dimensions.content, `${path} should fit the viewport`).toBeLessThanOrEqual(dimensions.viewport)
  }
})

test('skip link can move keyboard focus to the main content', async ({ page }) => {
  await page.goto('/?view=course&lesson=tiles-and-hand')
  const skipLink = page.getByRole('link', { name: '本文へスキップ' })
  await skipLink.press('Enter')

  await expect(page.locator('#main-content')).toBeFocused()
})

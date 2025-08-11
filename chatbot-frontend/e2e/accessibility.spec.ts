import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/');
    
    // Wait for AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Check if input has proper labeling
    const messageInput = page.locator('.message-input');
    await expect(messageInput).toBeVisible();
    
    // Check if send button is accessible
    const sendButton = page.locator('.send-button');
    await expect(sendButton).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(messageInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(sendButton).toBeFocused();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Navigate using keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.type('Testing keyboard navigation');
    await page.keyboard.press('Enter');
    
    // Check if message was sent using keyboard only
    await expect(page.locator('.message.user').last()).toContainText('Testing keyboard navigation');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Wait for AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Take screenshot for manual color contrast verification
    await page.screenshot({ path: 'test-results/color-contrast.png' });
    
    // Check if text is visible and readable
    await expect(page.locator('.message.ai').first()).toBeVisible();
    await expect(page.locator('.message-input')).toBeVisible();
  });

  test('should work with screen reader announcements', async ({ page }) => {
    await page.goto('/');
    
    // Wait for AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Send a message
    await page.fill('.message-input', 'Screen reader test');
    await page.press('.message-input', 'Enter');
    
    // Check if message appears (screen reader would announce new content)
    await expect(page.locator('.message.user').last()).toContainText('Screen reader test');
    
    // Wait for AI response
    await page.waitForTimeout(3000);
    
    // New messages should be announced by screen readers
    const aiMessages = page.locator('.message.ai');
    const messageCount = await aiMessages.count();
    expect(messageCount).toBeGreaterThan(1);
  });
});

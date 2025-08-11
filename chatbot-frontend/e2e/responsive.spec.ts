import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Wait for AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Check chat container width on desktop
    const chatContainer = page.locator('.chat-container');
    await expect(chatContainer).toBeVisible();
    
    // Check if messages are properly aligned
    const aiMessage = page.locator('.message.ai').first();
    const boundingBox = await aiMessage.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(200); // Should have reasonable width on desktop
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Wait for AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Check if layout adapts to tablet size
    const chatContainer = page.locator('.chat-container');
    await expect(chatContainer).toBeVisible();
    
    // Test message input on tablet
    await page.fill('.message-input', 'Tablet test message');
    await expect(page.locator('.send-button')).toBeEnabled();
  });

  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    await page.goto('/');
    
    // Wait for AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Check if elements are still accessible on mobile
    await expect(page.locator('.chat-container')).toBeVisible();
    await expect(page.locator('.message-input')).toBeVisible();
    await expect(page.locator('.send-button')).toBeVisible();
    
    // Test touch interaction (use click for cross-browser compatibility)
    await page.fill('.message-input', 'Mobile test');
    await page.click('.send-button');
    
    await expect(page.locator('.message.user').last()).toContainText('Mobile test');
  });

  test('should handle keyboard on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    // Wait for AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Focus on input to simulate keyboard appearance
    await page.focus('.message-input');
    
    // Check if input is still accessible when virtual keyboard appears
    await expect(page.locator('.message-input')).toBeVisible();
    await expect(page.locator('.send-button')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Basic Chat Tests', () => {
  test('should be able to send a simple message', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Type a simple greeting message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Hello');
    
    // Click send button
    await page.locator('[data-testid="send-button"]').click();
    
    // Wait for the message to appear in chat
    await expect(page.locator('.user-message').last()).toContainText('Hello');
    
    // Wait for AI response (should appear within 10 seconds)
    await expect(page.locator('.bot-message').last()).toBeVisible({ timeout: 10000 });
    
    // Verify we got some response text
    const aiResponse = await page.locator('.bot-message').last().textContent();
    expect(aiResponse).toBeTruthy();
    expect(aiResponse!.length).toBeGreaterThan(0);
  });

  test('should show typing indicator during response', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Type a message
    await page.locator('[data-testid="message-input"]').fill('How are you?');
    await page.locator('[data-testid="send-button"]').click();
    
    // Should show typing indicator
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible({ timeout: 5000 });
  });
});

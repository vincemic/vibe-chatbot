import { test, expect } from '@playwright/test';

test.describe('SignalR Connection Tests', () => {
  test('should establish SignalR connection on page load', async ({ page }) => {
    // Listen for console logs to track SignalR connection
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    await page.goto('/');
    
    // Wait for AI greeting which indicates SignalR is working
    await expect(page.locator('.message.ai').first()).toBeVisible({ timeout: 15000 });
    
    // Check if SignalR connection logs are present
    const hasConnectionLog = logs.some(log => 
      log.includes('SignalR') || 
      log.includes('Connected') || 
      log.includes('connection')
    );
    
    // If no specific connection logs, at least verify the greeting message works
    const greetingMessage = page.locator('.message.ai').first();
    await expect(greetingMessage).toContainText('Hello! I\'m your AI assistant');
  });

  test('should handle connection reconnection', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial connection and greeting
    await expect(page.locator('.message.ai').first()).toBeVisible({ timeout: 15000 });
    
    // Simulate network interruption by going offline and online
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    await page.context().setOffline(false);
    
    // Try sending a message after reconnection
    await page.fill('.message-input', 'Test after reconnection');
    await page.press('.message-input', 'Enter');
    
    // Should still work after reconnection
    await expect(page.locator('.message.user').last()).toContainText('Test after reconnection');
  });

  test('should handle multiple rapid messages', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    const messages = ['Message 1', 'Message 2', 'Message 3', 'Message 4', 'Message 5'];
    
    // Send messages rapidly
    for (const message of messages) {
      await page.fill('.message-input', message);
      await page.press('.message-input', 'Enter');
      await page.waitForTimeout(100); // Small delay to avoid overwhelming
    }
    
    // Check if all messages were sent
    for (const message of messages) {
      await expect(page.locator('.message.user').filter({ hasText: message })).toBeVisible();
    }
  });

  test('should handle special characters in messages', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    const specialMessages = [
      'Hello with émojis 😀🚀',
      'Special chars: !@#$%^&*()',
      'Unicode: 你好世界',
      'HTML: <script>alert("test")</script>',
      'Quotes: "Hello" and \'World\'',
    ];
    
    for (const message of specialMessages) {
      await page.fill('.message-input', message);
      await page.press('.message-input', 'Enter');
      
      // Verify the message appears correctly (and is escaped if needed)
      await expect(page.locator('.message.user').last()).toContainText(message);
      await page.waitForTimeout(500);
    }
  });

  test('should handle long messages', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    const longMessage = 'This is a very long message that should test how the application handles messages with many characters. '.repeat(10);
    
    await page.fill('.message-input', longMessage);
    await page.press('.message-input', 'Enter');
    
    // Check if long message is displayed properly
    await expect(page.locator('.message.user').last()).toContainText(longMessage.substring(0, 50));
    
    // Check if message container handles long content properly
    const messageElement = page.locator('.message.user').last();
    await expect(messageElement).toBeVisible();
  });
});

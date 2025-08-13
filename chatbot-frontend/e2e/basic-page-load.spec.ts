import { test, expect } from '@playwright/test';

test.describe('Basic Page Load Tests', () => {
  test('should load the chat application', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Chatbot Frontend/);
    
    // Check if the main container is visible
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Check if the message input is present
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    
    // Check if the send button is present
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
  });

  test('should be able to type in the message input', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the message input to be visible
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    
    // Wait for the input to be enabled (SignalR connection established)
    await expect(messageInput).toBeEnabled({ timeout: 30000 });
    
    // Type a test message
    await messageInput.fill('Hello, this is a test message');
    
    // Verify the text was entered
    await expect(messageInput).toHaveValue('Hello, this is a test message');
  });
});

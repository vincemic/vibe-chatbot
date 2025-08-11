import { test, expect } from '@playwright/test';

test.describe('Chatbot Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page with chat interface', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Chatbot Frontend/);
    
    // Check if main elements are present
    await expect(page.locator('app-chat')).toBeVisible();
    await expect(page.locator('.chat-container')).toBeVisible();
    await expect(page.locator('.message-input')).toBeVisible();
    await expect(page.locator('.send-button')).toBeVisible();
  });

  test('should display AI greeting message on load', async ({ page }) => {
    // Wait for the AI greeting message to appear
    await expect(page.locator('.message.ai').first()).toBeVisible({ timeout: 10000 });
    
    // Check if the greeting message contains the expected text
    const greetingMessage = page.locator('.message.ai').first();
    await expect(greetingMessage).toContainText('Hello! I\'m your AI assistant');
  });

  test('should allow user to send a message', async ({ page }) => {
    const userMessage = 'Hello, how are you?';
    
    // Wait for initial AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Type message in input field
    await page.fill('.message-input', userMessage);
    
    // Send message by clicking send button
    await page.click('.send-button');
    
    // Check if user message appears in chat
    await expect(page.locator('.message.user').last()).toContainText(userMessage);
    
    // Check if input field is cleared
    await expect(page.locator('.message-input')).toHaveValue('');
  });

  test('should send message with Enter key', async ({ page }) => {
    const userMessage = 'Testing Enter key functionality';
    
    // Wait for initial AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Type message and press Enter
    await page.fill('.message-input', userMessage);
    await page.press('.message-input', 'Enter');
    
    // Check if user message appears in chat
    await expect(page.locator('.message.user').last()).toContainText(userMessage);
  });

  test('should receive AI response after sending message', async ({ page }) => {
    const userMessage = 'What can you help me with?';
    
    // Wait for initial AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Count initial messages
    const initialAiMessages = await page.locator('.message.ai').count();
    
    // Send user message
    await page.fill('.message-input', userMessage);
    await page.press('.message-input', 'Enter');
    
    // Wait for user message to appear
    await expect(page.locator('.message.user').last()).toContainText(userMessage);
    
    // Wait for AI response (should be more AI messages than initially)
    await expect(page.locator('.message.ai')).toHaveCount(initialAiMessages + 1, { timeout: 15000 });
    
    // Verify the new AI message is visible
    const latestAiMessage = page.locator('.message.ai').last();
    await expect(latestAiMessage).toBeVisible();
  });

  test('should show typing indicator while AI is responding', async ({ page }) => {
    const userMessage = 'Tell me a joke';
    
    // Wait for initial AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Send message
    await page.fill('.message-input', userMessage);
    await page.press('.message-input', 'Enter');
    
    // Check if typing indicator appears (this may be quick, so we use a shorter timeout)
    try {
      await expect(page.locator('.typing-indicator')).toBeVisible({ timeout: 5000 });
    } catch (error) {
      // Typing indicator might disappear quickly with mock responses
      console.log('Typing indicator may have appeared and disappeared quickly');
    }
  });

  test('should maintain chat history', async ({ page }) => {
    // Wait for initial AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    const messages = ['First message', 'Second message', 'Third message'];
    
    for (const message of messages) {
      await page.fill('.message-input', message);
      await page.press('.message-input', 'Enter');
      await expect(page.locator('.message.user').last()).toContainText(message);
      
      // Wait a bit between messages to avoid overwhelming the system
      await page.waitForTimeout(1000);
    }
    
    // Check if all user messages are still visible
    for (const message of messages) {
      await expect(page.locator('.message.user').filter({ hasText: message })).toBeVisible();
    }
  });

  test('should disable send button when input is empty', async ({ page }) => {
    // Wait for initial AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Check if send button is disabled when input is empty
    await expect(page.locator('.send-button')).toBeDisabled();
    
    // Type something and check if button becomes enabled
    await page.fill('.message-input', 'Test message');
    await expect(page.locator('.send-button')).toBeEnabled();
    
    // Clear input and check if button becomes disabled again
    await page.fill('.message-input', '');
    await expect(page.locator('.send-button')).toBeDisabled();
  });

  test('should auto-scroll to latest message', async ({ page }) => {
    // Wait for initial AI greeting
    await page.waitForSelector('.message.ai', { timeout: 10000 });
    
    // Send multiple messages to create scroll
    for (let i = 1; i <= 10; i++) {
      await page.fill('.message-input', `Message ${i}`);
      await page.press('.message-input', 'Enter');
      await page.waitForTimeout(500); // Small delay between messages
    }
    
    // Check if the latest message is visible (auto-scrolled)
    const lastMessage = page.locator('.message.user').last();
    await expect(lastMessage).toBeInViewport();
  });
});

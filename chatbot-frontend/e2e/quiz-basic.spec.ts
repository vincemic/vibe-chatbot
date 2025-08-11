import { test, expect } from '@playwright/test';

test.describe('Quiz Functionality Tests', () => {
  test('should show quiz info when asking about quiz', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Type a quiz-related message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Tell me about quiz');
    
    // Click send button
    await page.locator('[data-testid="send-button"]').click();
    
    // Wait for the message to appear in chat
    await expect(page.locator('.user-message').last()).toContainText('Tell me about quiz');
    
    // Wait for AI response (should appear within 15 seconds)
    await expect(page.locator('.bot-message').last()).toBeVisible({ timeout: 15000 });
    
    // Verify we got a quiz-related response
    const aiResponse = await page.locator('.bot-message .message-text').last().textContent();
    expect(aiResponse).toBeTruthy();
    console.log('AI Response:', aiResponse);
    expect(aiResponse!.toLowerCase()).toContain('quiz');
  });

  test('should respond to start quiz request', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Type a start quiz message
    await page.locator('[data-testid="message-input"]').fill('start quiz');
    await page.locator('[data-testid="send-button"]').click();
    
    // Wait for user message
    await expect(page.locator('.user-message').last()).toContainText('start quiz');
    
    // Wait for AI response 
    await expect(page.locator('.bot-message').last()).toBeVisible({ timeout: 15000 });
    
    // Should get some kind of quiz response (either working quiz or setup message)
    const aiResponse = await page.locator('.bot-message .message-text').last().textContent();
    expect(aiResponse).toBeTruthy();
    console.log('Start Quiz Response:', aiResponse);
    expect(aiResponse!.length).toBeGreaterThan(10);
  });

  test('should handle quiz categories request', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Ask about quiz categories
    await page.locator('[data-testid="message-input"]').fill('quiz categories');
    await page.locator('[data-testid="send-button"]').click();
    
    // Wait for response
    await expect(page.locator('.bot-message').last()).toBeVisible({ timeout: 15000 });
    
    // Should get a response about categories
    const aiResponse = await page.locator('.bot-message .message-text').last().textContent();
    expect(aiResponse).toBeTruthy();
    console.log('Categories Response:', aiResponse);
    expect(aiResponse!.toLowerCase()).toMatch(/categor|topic|javascript|programming|available/);
  });
});

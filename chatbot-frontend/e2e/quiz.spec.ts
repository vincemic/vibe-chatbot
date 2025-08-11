import { test, expect } from '@playwright/test';

test.describe('Quiz Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load and SignalR connection to be established
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    await page.waitForTimeout(2000); // Allow time for SignalR connection
  });

  test('should start a basic quiz', async ({ page }) => {
    // Send message to start quiz
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Wait for AI response with quiz question
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    await expect(page.locator('.message.ai').last()).toContainText('A)');
    await expect(page.locator('.message.ai').last()).toContainText('B)');
    await expect(page.locator('.message.ai').last()).toContainText('C)');
    await expect(page.locator('.message.ai').last()).toContainText('D)');
  });

  test('should start a science quiz with specific category', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    await messageInput.fill('Start a science quiz');
    await sendButton.click();
    
    // Wait for AI response confirming science quiz started
    await expect(page.locator('.message.ai').last()).toContainText(/science|Science/);
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
  });

  test('should start an easy difficulty quiz', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    await messageInput.fill('Start an easy quiz');
    await sendButton.click();
    
    // Wait for AI response confirming easy quiz started
    await expect(page.locator('.message.ai').last()).toContainText(/easy|Easy/);
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
  });

  test('should handle quiz answers and track score', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start a quiz
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Wait for first question
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Answer the first question
    await messageInput.fill('A');
    await sendButton.click();
    
    // Wait for feedback and next question or results
    const lastMessage = page.locator('.message.ai').last();
    
    // Should either show next question or quiz results
    await expect(lastMessage).toContainText(/Question 2|Quiz completed|Your final score/);
  });

  test('should provide quiz status when requested', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start a quiz first
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Request quiz status
    await messageInput.fill('What is my quiz status?');
    await sendButton.click();
    
    // Should show current quiz progress
    await expect(page.locator('.message.ai').last()).toContainText(/Question.*of|score|progress/i);
  });

  test('should handle invalid quiz answers gracefully', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start a quiz
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Submit invalid answer
    await messageInput.fill('Z');
    await sendButton.click();
    
    // Should handle invalid answer gracefully
    await expect(page.locator('.message.ai').last()).toContainText(/invalid|Invalid|valid answer|A, B, C, or D/i);
  });

  test('should complete a full quiz and show final results', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start a quiz
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Answer multiple questions to complete the quiz
    // Note: This assumes a quiz has at least 3-5 questions
    const maxQuestions = 10; // Safety limit to prevent infinite loop
    let questionCount = 0;
    
    while (questionCount < maxQuestions) {
      const currentMessage = await page.locator('.message.ai').last().textContent();
      
      if (currentMessage?.includes('Quiz completed') || currentMessage?.includes('final score')) {
        break;
      }
      
      // Answer with 'A' for simplicity
      await messageInput.fill('A');
      await sendButton.click();
      
      // Wait for response
      await page.waitForTimeout(1000);
      questionCount++;
    }
    
    // Should show final results with score and grade
    const finalMessage = page.locator('.message.ai').last();
    await expect(finalMessage).toContainText(/Quiz completed|final score|grade|percentage/i);
  });

  test('should start a new quiz when one is already in progress', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start first quiz
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Start another quiz
    await messageInput.fill('Start a new quiz');
    await sendButton.click();
    
    // Should start a new quiz (reset progress)
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
  });

  test('should handle quiz with specific category and difficulty', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start a science quiz with medium difficulty
    await messageInput.fill('Start a medium difficulty science quiz');
    await sendButton.click();
    
    // Should start quiz with specified parameters
    const response = page.locator('.message.ai').last();
    await expect(response).toContainText(/science|Science/);
    await expect(response).toContainText(/medium|Medium/);
    await expect(response).toContainText('Question 1');
  });

  test('should show typing indicator during quiz interactions', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Should show typing indicator while processing
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    // Typing indicator should disappear when response arrives
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
  });

  test('should maintain quiz state across multiple interactions', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start quiz
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Answer first question
    await messageInput.fill('A');
    await sendButton.click();
    
    // Send unrelated message
    await messageInput.fill('Hello there');
    await sendButton.click();
    
    // Request quiz status - should still have quiz in progress
    await messageInput.fill('What is my quiz status?');
    await sendButton.click();
    
    await expect(page.locator('.message.ai').last()).toContainText(/Question|score|quiz/i);
  });

  test('should handle network errors gracefully during quiz', async ({ page }) => {
    // Start a quiz first
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Simulate network interruption by going offline
    await page.context().setOffline(true);
    
    // Try to answer question
    await messageInput.fill('A');
    await sendButton.click();
    
    // Should handle gracefully (might show connection error or retry)
    await page.waitForTimeout(2000);
    
    // Restore connection
    await page.context().setOffline(false);
    
    // Should be able to continue quiz
    await messageInput.fill('A');
    await sendButton.click();
    
    // Should eventually receive response
    await expect(page.locator('.message.ai').last()).toContainText(/Question|score|Quiz/i);
  });
});

test.describe('Quiz Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    await page.waitForTimeout(2000);
  });

  test('should handle quiz request with no API access', async ({ page }) => {
    // This test assumes the app can handle API failures gracefully
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Block requests to quiz API
    await page.route('**/api.quizapi.io/**', route => route.abort());
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Should either provide fallback questions or graceful error
    const response = page.locator('.message.ai').last();
    await expect(response).toContainText(/Question|quiz|error|unavailable/i);
  });

  test('should validate quiz categories', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Try invalid category
    await messageInput.fill('Start a nonexistent category quiz');
    await sendButton.click();
    
    // Should either start a general quiz or provide available categories
    await expect(page.locator('.message.ai').last()).toContainText(/Question|category|available/i);
  });

  test('should handle rapid quiz commands', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Send multiple quiz commands rapidly
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    await messageInput.fill('A');
    await sendButton.click();
    
    await messageInput.fill('B');
    await sendButton.click();
    
    await messageInput.fill('What is my status?');
    await sendButton.click();
    
    // Should handle all commands appropriately without errors
    await page.waitForTimeout(3000);
    
    // Last message should be relevant to quiz
    await expect(page.locator('.message.ai').last()).toContainText(/Question|score|quiz|status/i);
  });
});

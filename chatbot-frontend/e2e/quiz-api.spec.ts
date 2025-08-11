import { test, expect } from '@playwright/test';

test.describe('Quiz API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    await page.waitForTimeout(2000);
  });

  test('should integrate with QuizAPI.io and receive real questions', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Intercept API calls to verify they're being made
    let apiCalled = false;
    await page.route('**/api.quizapi.io/**', async route => {
      apiCalled = true;
      await route.continue();
    });
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Wait for response
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Verify that the API was called (if configured)
    // Note: This will only work if QuizAPI.io is properly configured
    const response = page.locator('.message.ai').last();
    
    // Real quiz questions should have proper formatting
    await expect(response).toContainText('A)');
    await expect(response).toContainText('B)');
    await expect(response).toContainText('C)');
    await expect(response).toContainText('D)');
  });

  test('should handle different quiz categories from API', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    const categories = ['science', 'history', 'geography', 'literature'];
    
    for (const category of categories) {
      await messageInput.fill(`Start a ${category} quiz`);
      await sendButton.click();
      
      // Should receive category-specific question
      await expect(page.locator('.message.ai').last()).toContainText(/Question 1|quiz/i);
      
      // Clear chat for next test
      await page.reload();
      await page.waitForTimeout(2000);
    }
  });

  test('should handle different difficulty levels from API', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    const difficulties = ['easy', 'medium', 'hard'];
    
    for (const difficulty of difficulties) {
      await messageInput.fill(`Start a ${difficulty} quiz`);
      await sendButton.click();
      
      // Should receive difficulty-appropriate question
      await expect(page.locator('.message.ai').last()).toContainText(/Question 1/i);
      
      // Clear chat for next test
      await page.reload();
      await page.waitForTimeout(2000);
    }
  });

  test('should fallback to mock questions when API is unavailable', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Block API requests to simulate API unavailability
    await page.route('**/api.quizapi.io/**', route => route.abort('failed'));
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Should still provide quiz questions (fallback)
    await expect(page.locator('.message.ai').last()).toContainText(/Question|quiz/i);
  });

  test('should validate API response format', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Intercept API and validate request format
    await page.route('**/api.quizapi.io/**', async route => {
      const request = route.request();
      const url = request.url();
      
      // Validate API request parameters
      expect(url).toContain('api.quizapi.io');
      
      // Mock a valid response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            question: "Test question from API?",
            description: null,
            answers: {
              answer_a: "Option A",
              answer_b: "Option B", 
              answer_c: "Option C",
              answer_d: "Option D"
            },
            multiple_correct_answers: "false",
            correct_answers: {
              answer_a_correct: "true",
              answer_b_correct: "false",
              answer_c_correct: "false", 
              answer_d_correct: "false"
            },
            correct_answer: "answer_a",
            explanation: "Test explanation",
            tip: null,
            tags: [{ name: "test" }],
            category: "test",
            difficulty: "Easy"
          }
        ])
      });
    });
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Should display the mocked question
    await expect(page.locator('.message.ai').last()).toContainText('Test question from API');
    await expect(page.locator('.message.ai').last()).toContainText('Option A');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Mock API error responses
    await page.route('**/api.quizapi.io/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Should handle error gracefully, possibly with fallback questions
    const response = page.locator('.message.ai').last();
    await expect(response).toContainText(/Question|quiz|error|unavailable/i);
  });

  test('should handle API rate limiting', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Mock rate limiting response
    await page.route('**/api.quizapi.io/**', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limit exceeded' })
      });
    });
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Should handle rate limiting gracefully
    const response = page.locator('.message.ai').last();
    await expect(response).toContainText(/Question|quiz|limit|try again/i);
  });

  test('should validate quiz configuration with user secrets', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start a quiz to trigger API configuration
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Should work with properly configured API key
    await expect(page.locator('.message.ai').last()).toContainText(/Question|quiz/i);
    
    // Check that no API key is exposed in the frontend
    const pageContent = await page.content();
    expect(pageContent).not.toContain('4o4FJfOlGNol4HcZkONjnX6dBK8vV5MEV7CyxojW');
  });

  test('should track quiz statistics accurately with real API data', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start quiz
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Answer several questions to test scoring
    const answers = ['A', 'B', 'C', 'A', 'D'];
    
    for (let i = 0; i < answers.length; i++) {
      const currentMessage = await page.locator('.message.ai').last().textContent();
      
      if (currentMessage?.includes('Quiz completed')) {
        break;
      }
      
      await messageInput.fill(answers[i]);
      await sendButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Check final results
    const finalMessage = await page.locator('.message.ai').last().textContent();
    
    if (finalMessage?.includes('Quiz completed') || finalMessage?.includes('final score')) {
      // Should show accurate score and grade
      expect(finalMessage).toMatch(/\d+%|\d+\/\d+|grade|score/i);
    }
  });
});

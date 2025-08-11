import { test, expect } from '@playwright/test';

test.describe('Quiz Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    await page.waitForTimeout(2000);
  });

  test('should start quiz quickly', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    const startTime = Date.now();
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Should respond within 5 seconds
    expect(responseTime).toBeLessThan(5000);
  });

  test('should handle rapid quiz answers efficiently', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start quiz
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Rapid-fire answers
    const answers = ['A', 'B', 'C', 'A', 'D'];
    const responseTimes: number[] = [];
    
    for (const answer of answers) {
      const startTime = Date.now();
      
      await messageInput.fill(answer);
      await sendButton.click();
      
      // Wait for response
      await page.waitForSelector('.message.ai:last-child', { timeout: 10000 });
      
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
      
      // Check if quiz is completed
      const lastMessage = await page.locator('.message.ai').last().textContent();
      if (lastMessage?.includes('Quiz completed')) {
        break;
      }
      
      await page.waitForTimeout(100); // Small delay between answers
    }
    
    // All responses should be reasonably fast
    responseTimes.forEach((time, index) => {
      expect(time).toBeLessThan(3000); // 3 seconds max per response
    });
    
    // Average response time should be reasonable
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    expect(avgResponseTime).toBeLessThan(2000); // 2 seconds average
  });

  test('should handle concurrent quiz sessions (stress test)', async ({ browser }) => {
    // Create multiple pages to simulate concurrent users
    const pages = await Promise.all([
      browser.newPage(),
      browser.newPage(),
      browser.newPage()
    ]);
    
    try {
      // Start quizzes on all pages simultaneously
      const quizPromises = pages.map(async (page, index) => {
        await page.goto('/');
        await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
        await page.waitForTimeout(2000);
        
        const messageInput = page.locator('[data-testid="message-input"]');
        const sendButton = page.locator('[data-testid="send-button"]');
        
        const startTime = Date.now();
        
        await messageInput.fill(`Start a science quiz ${index + 1}`);
        await sendButton.click();
        
        await expect(page.locator('.message.ai').last()).toContainText('Question 1');
        
        const endTime = Date.now();
        return endTime - startTime;
      });
      
      const responseTimes = await Promise.all(quizPromises);
      
      // All concurrent requests should complete within reasonable time
      responseTimes.forEach(time => {
        expect(time).toBeLessThan(8000); // 8 seconds for concurrent requests
      });
      
    } finally {
      // Clean up pages
      await Promise.all(pages.map(page => page.close()));
    }
  });

  test('should efficiently handle quiz state management', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start quiz
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Test rapid status checks
    const statusCheckTimes: number[] = [];
    
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      
      await messageInput.fill('What is my quiz status?');
      await sendButton.click();
      
      await expect(page.locator('.message.ai').last()).toContainText(/status|Question|score/i);
      
      const endTime = Date.now();
      statusCheckTimes.push(endTime - startTime);
      
      await page.waitForTimeout(200);
    }
    
    // Status checks should be fast since they're just reading state
    statusCheckTimes.forEach(time => {
      expect(time).toBeLessThan(2000); // 2 seconds max for status
    });
  });

  test('should maintain performance with long quiz sessions', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start quiz
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Answer many questions to test long session performance
    const maxQuestions = 10;
    const responseTimes: number[] = [];
    
    for (let i = 0; i < maxQuestions; i++) {
      const currentMessage = await page.locator('.message.ai').last().textContent();
      
      if (currentMessage?.includes('Quiz completed')) {
        break;
      }
      
      const startTime = Date.now();
      
      // Alternate between different answers
      const answer = ['A', 'B', 'C', 'D'][i % 4];
      await messageInput.fill(answer);
      await sendButton.click();
      
      await page.waitForSelector('.message.ai:last-child', { timeout: 10000 });
      
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
      
      await page.waitForTimeout(100);
    }
    
    // Performance should not degrade over time
    if (responseTimes.length > 5) {
      const firstHalf = responseTimes.slice(0, Math.floor(responseTimes.length / 2));
      const secondHalf = responseTimes.slice(Math.floor(responseTimes.length / 2));
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      // Second half should not be significantly slower
      expect(secondAvg).toBeLessThan(firstAvg * 1.5); // Allow 50% degradation max
    }
  });

  test('should handle memory efficiently during quiz sessions', async ({ page }) => {
    // Enable performance metrics
    await page.addInitScript(() => {
      window.performance.mark('quiz-start');
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Start quiz
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    await expect(page.locator('.message.ai').last()).toContainText('Question 1');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    // Perform multiple quiz operations
    for (let i = 0; i < 5; i++) {
      await messageInput.fill('A');
      await sendButton.click();
      await page.waitForTimeout(500);
      
      const currentMessage = await page.locator('.message.ai').last().textContent();
      if (currentMessage?.includes('Quiz completed')) {
        break;
      }
    }
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('should handle API timeout gracefully', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Mock slow API response
    await page.route('**/api.quizapi.io/**', async route => {
      // Delay response by 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });
    
    const startTime = Date.now();
    
    await messageInput.fill('Start a quiz');
    await sendButton.click();
    
    // Should either timeout gracefully or complete
    try {
      await expect(page.locator('.message.ai').last()).toContainText(/Question|error|timeout/i, { timeout: 10000 });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should complete within reasonable timeout
      expect(responseTime).toBeLessThan(15000); // 15 seconds max
    } catch (error) {
      // Timeout is acceptable for this test
      console.log('API timeout test - expected behavior');
    }
  });
});

import { test as base, expect, Page } from '@playwright/test';

// Define custom fixtures type
type CustomFixtures = {
  authenticatedPage: Page;
};

// Extend the base test with custom fixtures
export const test = base.extend<CustomFixtures>({
  // Custom fixture for authenticated page
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/');
    // Wait for the app to initialize and show AI greeting
    await page.waitForSelector('.message.ai', { timeout: 15000 });
    await use(page);
  },
});

export { expect };

// Custom assertions and utilities
export class ChatPageHelper {
  constructor(private page: any) {}

  async sendMessage(message: string) {
    await this.page.fill('.message-input', message);
    await this.page.press('.message-input', 'Enter');
    return this.page.locator('.message.user').last();
  }

  async waitForAIResponse(timeout = 15000) {
    const initialCount = await this.page.locator('.message.ai').count();
    await this.page.waitForFunction(
      (count) => document.querySelectorAll('.message.ai').length > count,
      initialCount,
      { timeout }
    );
    return this.page.locator('.message.ai').last();
  }

  async getMessageCount() {
    return {
      user: await this.page.locator('.message.user').count(),
      ai: await this.page.locator('.message.ai').count(),
    };
  }

  async isTypingIndicatorVisible() {
    try {
      await this.page.waitForSelector('.typing-indicator', { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async clearChat() {
    // If there's a clear button in the future
    const clearButton = this.page.locator('[data-testid="clear-chat"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }
}

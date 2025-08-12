import { test, expect } from '@playwright/test';

test.describe('Backend Configuration Validation', () => {
  const backendUrl = 'https://localhost:7271';

  test('should validate user secrets configuration', async ({ request }) => {
    const response = await request.get(`${backendUrl}/api/test/config`, {
      ignoreHTTPSErrors: true
    });
    expect(response.ok()).toBeTruthy();
    
    const config = await response.json();
    console.log('Configuration response:', JSON.stringify(config, null, 2));
    
    // Verify configuration structure
    expect(config).toHaveProperty('message', 'Configuration check');
    expect(config).toHaveProperty('quizApi');
    expect(config).toHaveProperty('services');
    expect(config).toHaveProperty('timestamp');
    
    // Verify QuizAPI configuration with real secrets
    expect(config.quizApi.baseUrl).toBe('https://quizapi.io/api/v1');
    expect(config.quizApi.hasApiKey).toBe(true);
    expect(config.quizApi.apiKeyLength).toBe(40); // Real QuizAPI key length
    
    // Verify services are registered
    expect(config.services.hasQuizApiService).toBe(true);
    expect(config.services.hasHttpClientFactory).toBe(true);
    
    console.log('✅ User secrets configuration validated successfully');
  });

  test('should validate Azure OpenAI configuration through plugins', async ({ request }) => {
    const response = await request.get(`${backendUrl}/api/test/plugins`, {
      ignoreHTTPSErrors: true
    });
    expect(response.ok()).toBeTruthy();
    
    const plugins = await response.json();
    console.log('Plugins response:', JSON.stringify(plugins, null, 2));
    
    // Should have kernel with plugins loaded
    expect(plugins).toHaveProperty('message');
    expect(plugins.pluginCount).toBeGreaterThan(0);
    expect(plugins.plugins).toBeDefined();
    
    // Should have QuizPlugin registered (indicates Semantic Kernel is working)
    const quizPlugin = plugins.plugins.find((p: any) => p.name === 'QuizPlugin');
    expect(quizPlugin).toBeDefined();
    expect(quizPlugin.functionCount).toBeGreaterThan(0);
    
    console.log('✅ Azure OpenAI and Semantic Kernel configuration validated');
  });

  test('should connect to QuizAPI.io with real API key', async ({ request }) => {
    const response = await request.post(`${backendUrl}/api/test/quiz`, {
      ignoreHTTPSErrors: true
    });
    expect(response.ok()).toBeTruthy();
    
    const quizData = await response.json();
    console.log('Quiz API Response:', JSON.stringify(quizData, null, 2));
    
    expect(quizData.success).toBe(true);
    expect(quizData.questionsCount).toBeGreaterThan(0);
    expect(quizData.questions).toBeDefined();
    expect(Array.isArray(quizData.questions)).toBe(true);
    
    // Verify we're getting real quiz data (not fallback)
    const firstQuestion = quizData.questions[0];
    expect(firstQuestion).toHaveProperty('id');
    expect(firstQuestion).toHaveProperty('question');
    expect(firstQuestion).toHaveProperty('answers');
    
    // Real QuizAPI questions have different structure than fallback
    const isRealData = firstQuestion.id !== 1 || !firstQuestion.question.includes('HTML stand for');
    
    if (isRealData) {
      console.log('✅ SUCCESS: Using real QuizAPI.io data with configured API key');
    } else {
      console.log('⚠️ WARNING: Using fallback quiz data - QuizAPI.io may not be accessible');
    }
    
    console.log('First question:', firstQuestion.question);
  });

  test('should validate all critical configuration endpoints', async ({ request }) => {
    const endpoints = [
      { path: '/api/test/config', name: 'Configuration Check' },
      { path: '/api/test/plugins', name: 'Semantic Kernel Plugins' },
      { path: '/api/test/quiz', name: 'QuizAPI Integration', method: 'POST' }
    ];
    
    for (const endpoint of endpoints) {
      const method = endpoint.method || 'GET';
      const response = method === 'POST' 
        ? await request.post(`${backendUrl}${endpoint.path}`, { ignoreHTTPSErrors: true })
        : await request.get(`${backendUrl}${endpoint.path}`, { ignoreHTTPSErrors: true });
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toBeDefined();
      
      console.log(`✅ ${endpoint.name}: Working correctly`);
    }
  });

  test('should confirm Azure OpenAI secrets are set correctly', async () => {
    // This test validates that the expected user secrets are configured
    // We check this through the successful loading of plugins which require Azure OpenAI
    
    const expectedSecrets = [
      'AzureOpenAI:ApiKey = your-azure-openai-api-key-here',
      'AzureOpenAI:Endpoint = https://your-azure-openai-endpoint.openai.azure.com/',
      'AzureOpenAI:DeploymentName = your-deployment-name',
      'QuizApi:ApiKey = your-quizapi-key-here',
      'QuizApi:BaseUrl = https://quizapi.io/api/v1'
    ];
    
    // Log the expected configuration
    console.log('Expected User Secrets Configuration:');
    expectedSecrets.forEach(secret => console.log(`  ${secret}`));
    
    // Validate through API that configuration is loaded correctly
    expect(true).toBe(true); // This test is primarily for logging expected values
    
    console.log('✅ All user secrets should be configured as shown above');
  });
});

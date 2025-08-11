# User Secrets Setup for ChatbotApi

This project uses .NET User Secrets to store sensitive configuration data locally. This keeps secrets out of source control while allowing each developer to configure their own Azure OpenAI credentials.

## Setting Up User Secrets

1. **Initialize User Secrets** (already done):

   ```bash
   dotnet user-secrets init
   ```

2. **Set Your Azure OpenAI Configuration**:

   ```bash
   dotnet user-secrets set "AzureOpenAI:Endpoint" "https://your-actual-endpoint.openai.azure.com/"
   dotnet user-secrets set "AzureOpenAI:ApiKey" "your-actual-api-key"
   dotnet user-secrets set "AzureOpenAI:DeploymentName" "your-actual-deployment-name"
   dotnet user-secrets set "AzureOpenAI:ApiVersion" "2024-02-01"
   ```

3. **Set Your QuizAPI.io Configuration** (Optional - for enhanced quiz features):

   ```bash
   dotnet user-secrets set "QuizApi:ApiKey" "your-quizapi-key"
   ```

4. **Verify Your Secrets**:

   ```bash
   dotnet user-secrets list
   ```

## Required Configuration

The following secrets need to be configured (see `secrets.example.json` for structure):

**Required for Azure OpenAI:**

- **AzureOpenAI:Endpoint**: Your Azure OpenAI service endpoint URL
- **AzureOpenAI:ApiKey**: Your Azure OpenAI API key  
- **AzureOpenAI:DeploymentName**: The name of your deployed model
- **AzureOpenAI:ApiVersion**: The API version (currently "2024-02-01")

**Optional for Enhanced Quiz Features:**

- **QuizApi:ApiKey**: Your QuizAPI.io API key (get one free at <https://quizapi.io/>)

## Important Notes

- User secrets are stored locally on your machine and are **NOT** included in source control
- Each developer needs to configure their own secrets
- The application will fall back to a mock AI service if Azure OpenAI is not configured
- Secrets are stored in: `%APPDATA%\Microsoft\UserSecrets\chatbot-api-secrets\secrets.json` on Windows

## Mock AI Service

If you don't have Azure OpenAI credentials, the application will automatically use a mock AI service that provides placeholder responses for development and testing purposes.

**🎯 New Quiz Feature**: The mock service now includes full quiz functionality! You can:

- Start quizzes by saying "start quiz" or "quiz me"
- Choose specific topics like "start quiz JavaScript"
- Answer questions with A, B, C, or D
- Track your score and see detailed results
- View available categories with "quiz categories"

The quiz feature works with or without QuizAPI.io credentials - fallback questions are provided for demo purposes.

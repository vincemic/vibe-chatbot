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

3. **Verify Your Secrets**:

   ```bash
   dotnet user-secrets list
   ```

## Required Configuration

The following secrets need to be configured (see `secrets.example.json` for structure):

- **AzureOpenAI:Endpoint**: Your Azure OpenAI service endpoint URL
- **AzureOpenAI:ApiKey**: Your Azure OpenAI API key  
- **AzureOpenAI:DeploymentName**: The name of your deployed model
- **AzureOpenAI:ApiVersion**: The API version (currently "2024-02-01")

## Important Notes

- User secrets are stored locally on your machine and are **NOT** included in source control
- Each developer needs to configure their own secrets
- The application will fall back to a mock AI service if Azure OpenAI is not configured
- Secrets are stored in: `%APPDATA%\Microsoft\UserSecrets\chatbot-api-secrets\secrets.json` on Windows

## Mock AI Service

If you don't have Azure OpenAI credentials, the application will automatically use a mock AI service that provides placeholder responses for development and testing purposes.

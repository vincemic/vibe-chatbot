# Security Guidelines for Sematic Chatbot Project

## 🔒 Secret Management

### User Secrets (Recommended)
Use .NET user secrets for sensitive configuration:

```bash
cd ChatbotApi
dotnet user-secrets set "AzureOpenAI:ApiKey" "your-api-key"
dotnet user-secrets set "AzureOpenAI:Endpoint" "https://your-endpoint.openai.azure.com/"
dotnet user-secrets set "AzureOpenAI:DeploymentName" "your-deployment"
dotnet user-secrets set "QuizApi:ApiKey" "your-quiz-api-key"
```

### Environment Variables
Alternatively, use environment variables:

```bash
$env:AzureOpenAI__ApiKey = "your-api-key"
$env:AzureOpenAI__Endpoint = "https://your-endpoint.openai.azure.com/"
$env:QuizApi__ApiKey = "your-quiz-api-key"
```

## 🚨 Files to Never Commit with Secrets

- `e2e/*.spec.ts` - Replace actual secrets with placeholders
- `*RESULTS.md` - These files may contain validation output with secrets
- `appsettings.*.json` - Avoid committing with real secrets
- Any log files containing API responses

## ✅ Safe Practices

1. **Use Template Files**: Create `.template` versions of test files
2. **Placeholder Values**: Use `your-api-key-here` in committed code
3. **Environment-Specific**: Keep secrets in user secrets or env vars
4. **Regular Audits**: Run `git log --grep="api.key\|secret\|password"` to check history

## 🔍 Pre-Commit Security Check

Before committing, run:

```bash
# Check for potential secrets in staged files
git diff --cached | grep -i "api.key\|secret\|password\|token"

# Check specific patterns
git diff --cached | grep -E "[a-fA-F0-9]{32,}"  # 32+ char hex strings
```

## 🛠️ If Secrets Are Accidentally Committed

1. **Immediately rotate** the exposed credentials
2. **Remove from git history** using BFG Repo-Cleaner or filter-branch
3. **Force push** to update remote repository
4. **Notify team members** to pull latest changes

## 📝 Test File Patterns

For test files that need to validate secrets:

```typescript
// ❌ Don't do this
const apiKey = 'your-actual-api-key-here';

// ✅ Do this instead
const apiKey = process.env.AZURE_OPENAI_API_KEY || 'your-api-key-here';
```

## 🎯 Configuration Validation

The project includes configuration validation tests that:
- Verify secrets are properly configured
- Test external service connectivity
- Validate fallback mechanisms
- Ensure proper error handling

These tests use placeholder values in committed code and expect developers to replace them with actual values for testing.

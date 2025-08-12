# Semantic Chatbot Application - AI Coding Agent Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## 🎯 Project Overview
Full-stack real-time chatbot application with sophisticated architecture:
- **Frontend**: Angular 19 SPA with TypeScript, SignalR client, responsive design, NGX-Logger telemetry
- **Backend**: .NET Core 8 Web API with Azure OpenAI, Semantic Kernel, SignalR hub, Serilog logging
- **AI Integration**: Azure OpenAI with QuizPlugin architecture and intelligent fallback mechanisms
- **Real-time Communication**: SignalR with automatic reconnection and comprehensive error handling
- **Testing**: Playwright E2E tests covering functionality, responsiveness, accessibility, and SignalR integration

## 🏗️ Critical Architecture Patterns

### 1. Singleton Dependency Injection Pattern ⚠️ IMPORTANT
**ALL backend services are registered as SINGLETONS** for consistent dependency injection across controllers and SignalR hubs:

```csharp
// ChatbotApi/Program.cs - Follow this pattern for ALL services
builder.Services.AddSingleton<IQuizApiService>(serviceProvider => { /* factory */ });
builder.Services.AddSingleton<IQuizSessionStore, QuizSessionStore>();
builder.Services.AddSingleton<IQuizSessionService, QuizSessionService>();
builder.Services.AddSingleton<Kernel>(serviceProvider => { /* kernel configuration */ });
builder.Services.AddSingleton<IChatCompletionService>(serviceProvider => { /* chat service */ });
```

**Why Singletons**: Ensures same service instances across SignalR hubs and controllers, prevents injection conflicts.

### 2. SSL Certificate Handling for Development
Custom SSL validation for Azure OpenAI in development environment:

```csharp
// ChatbotApi/Program.cs - SSL certificate validation pattern
if (builder.Environment.IsDevelopment())
{
    var handler = new HttpClientHandler();
    handler.ServerCertificateCustomValidationCallback = (message, cert, chain, errors) =>
    {
        Log.Warning("SSL Certificate validation issue encountered: {Errors}", errors);
        return errors == System.Net.Security.SslPolicyErrors.None || 
               errors == System.Net.Security.SslPolicyErrors.RemoteCertificateChainErrors;
    };
    httpClient = new HttpClient(handler);
}
```

### 3. Multi-Layer Error Handling with Intelligent Fallbacks
**ChatHub.cs** implements sophisticated error handling:

```csharp
// Pattern: Specific exception handling with contextual fallbacks
try {
    var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory);
    responseContent = response.Content ?? "I'm sorry, I couldn't generate a response.";
}
catch (Microsoft.SemanticKernel.HttpOperationException httpEx) {
    _logger.LogWarning(httpEx, "Azure OpenAI HTTP error for user {User}. Using fallback response.", user);
    responseContent = GenerateFallbackResponse(message);
}
catch (System.Net.Http.HttpRequestException httpReqEx) {
    responseContent = GenerateFallbackResponse(message);
}
catch (Exception serviceEx) {
    responseContent = GenerateFallbackResponse(message);
}
```

### 4. QuizPlugin Architecture with Semantic Kernel
Register plugins using singleton services from DI container:

```csharp
// ChatbotApi/Program.cs - Plugin registration pattern
var logger = serviceProvider.GetRequiredService<ILogger<QuizPlugin>>();
var quizSessionService = serviceProvider.GetRequiredService<IQuizSessionService>();
var quizPlugin = new QuizPlugin(quizSessionService, logger);
var addedPlugin = kernel.Plugins.AddFromObject(quizPlugin, "QuizPlugin");
```

### 5. Thread-Safe Service Implementation
Services use `ConcurrentDictionary` and locking for thread safety:

```csharp
// Pattern for thread-safe singleton services
public class QuizSessionStore : IQuizSessionStore
{
    private readonly ConcurrentDictionary<string, QuizSession> _sessions = new();
    // Methods use ConcurrentDictionary for thread safety
}

public class QuizApiService : IQuizApiService
{
    private readonly object _lock = new object();
    // Use lock for HttpClient configuration in constructor
}
```

## 🔌 SignalR Real-Time Communication

### Frontend Pattern (chat.service.ts)
```typescript
// SignalR connection with automatic reconnection and comprehensive logging
this.hubConnection = new HubConnectionBuilder()
  .withUrl('https://localhost:7271/chathub')
  .withAutomaticReconnect()
  .configureLogging(LogLevel.Information)
  .build();

// Event handlers for connection state management
this.hubConnection.onreconnecting(() => {
  this.logger.info('SignalR connection lost, attempting to reconnect...');
  this.connectionStateSubject.next(false);
});
```

### Backend Pattern (ChatHub.cs)
```csharp
// ChatHub inherits from Hub with dependency injection
public class ChatHub : Hub
{
    public ChatHub(Kernel kernel, IChatCompletionService chatCompletionService, ILogger<ChatHub> logger)
    
    // Welcome message on connection
    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("ReceiveMessage", "Assistant", "Hello! I'm your AI assistant. How can I help you today?");
    }
}
```

## 🧪 Testing Strategy and Patterns

### E2E Testing with Playwright
- **Core Functionality**: UI elements, messaging, typing indicators, chat history
- **Responsive Design**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x812)
- **SignalR Integration**: Connection, reconnection, rapid messages, special characters
- **Accessibility**: ARIA labels, keyboard navigation, screen reader compatibility
- **Quiz Functionality**: API integration, fallback handling, network errors

### Test Helper Patterns
```typescript
// chatbot-frontend/e2e/test-setup.ts
export class ChatPageHelper {
  async waitForAIResponse(timeout = 15000) {
    const initialCount = await this.page.locator('.message.ai').count();
    await this.page.waitForFunction(
      (count) => document.querySelectorAll('.message.ai').length > count,
      initialCount, { timeout }
    );
  }
}
```

## 🛠️ VS Code Development Workflow

### Debugging Configuration
**Press F5** to launch full-stack debugging:
```json
// .vscode/launch.json - Compound configuration
{
  "name": "Launch Full Stack (Frontend + Backend)",
  "type": "compound",
  "configurations": ["Launch Backend", "Launch Frontend"]
}
```

### Task Automation
**Key Commands**:
- `Ctrl+Shift+P` → "Tasks: Run Task" → "Start All" (runs both frontend and backend)
- `F5` → Full-stack debugging with automatic browser launch
- `Ctrl+Shift+P` → "Tasks: Run Task" → "Build All" (builds both projects)

### Process Management
Use provided scripts for cleanup:
- `stop-all-processes.ps1` (PowerShell)
- `stop-all-processes.bat` (Batch)

## 📁 Key File Locations and Responsibilities

### Backend Core Files
- **`ChatbotApi/Program.cs`**: Main configuration, singleton DI registration, SSL handling
- **`ChatbotApi/Hubs/ChatHub.cs`**: SignalR hub with multi-layer error handling
- **`ChatbotApi/Services/`**: All services (QuizApi, QuizSession, MockChat) with thread-safe patterns
- **`ChatbotApi/Plugins/QuizPlugin.cs`**: Semantic Kernel plugin implementation

### Frontend Core Files
- **`chatbot-frontend/src/app/services/chat.service.ts`**: SignalR client with auto-reconnection
- **`chatbot-frontend/src/app/components/chat/chat.component.ts`**: Main chat UI with typing indicators
- **`chatbot-frontend/e2e/`**: Comprehensive Playwright test suite

### Configuration Files
- **`.vscode/launch.json`**: Multi-configuration debugging setup
- **`.vscode/tasks.json`**: Build, test, and run tasks for both projects
- **`ChatbotApi/appsettings.json`**: Azure OpenAI and QuizAPI configuration

## ⚡ Quick Start Commands

### First-Time Setup
```bash
# Install dependencies
cd chatbot-frontend && npm install
cd ../ChatbotApi && dotnet restore

# Run E2E tests
cd chatbot-frontend && npm run e2e
```

### Daily Development
- **Start Development**: Press `F5` in VS Code
- **Run Tests**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Test All"
- **Stop All Processes**: Run `stop-all-processes.ps1`

## 🔧 Configuration Management

### User Secrets (Required for Azure OpenAI)
```bash
cd ChatbotApi
dotnet user-secrets set "AzureOpenAI:Endpoint" "your-endpoint"
dotnet user-secrets set "AzureOpenAI:ApiKey" "your-api-key"
dotnet user-secrets set "AzureOpenAI:DeploymentName" "your-deployment"
```

### Environment-Specific Patterns
- **Development**: Uses SSL certificate bypass and enhanced logging
- **Production**: Full SSL validation and optimized logging levels
- **Testing**: Mock services with fallback responses for offline scenarios

## 🚨 Common Troubleshooting Patterns

### SSL Certificate Issues
- **Symptom**: Azure OpenAI connection failures
- **Solution**: Already implemented in `Program.cs` with custom validation callback

### SignalR Connection Issues
- **Symptom**: Messages not sending/receiving
- **Solution**: Check CORS configuration and connection state observables

### Singleton Service Issues
- **Symptom**: Service injection failures in SignalR hubs
- **Solution**: Verify all services are registered as singletons in `Program.cs`

### Quiz Plugin Not Working
- **Symptom**: Quiz commands not recognized
- **Solution**: Check plugin registration logging and kernel function enumeration

## 📋 Development Checklist

When working on this project:
- [ ] Always register new services as singletons
- [ ] Use the established error handling patterns with fallback responses
- [ ] Test both online (Azure OpenAI) and offline (mock) scenarios
- [ ] Verify SignalR connection state management
- [ ] Add appropriate Playwright tests for new functionality
- [ ] Use provided VS Code tasks and debugging configurations
- [ ] Follow the established logging patterns with Serilog/NGX-Logger
- [ ] Implement responsive design following existing mobile-first patterns

## 💡 AI Assistant Behavior
The chatbot greets users with: **"Hello! I'm your AI assistant. How can I help you today?"**

Special responses include Captain Kirk knowledge and quiz functionality. The system gracefully falls back to mock responses when Azure OpenAI is unavailable, ensuring the application always remains functional for demonstration and development purposes.

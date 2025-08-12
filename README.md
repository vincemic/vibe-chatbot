# Semantic Chatbot Application

A sophisticated full-stack chatbot application built with Angular frontend and .NET Core backend, featuring real-time communication via SignalR and AI-powered responses using Azure OpenAI with Microsoft Semantic Kernel.

## 🏗️ Architecture

- **Frontend**: Angular 19 SPA with TypeScript, SignalR client, responsive design, NGX-Logger telemetry
- **Backend**: .NET Core 8 Web API with Azure OpenAI, Semantic Kernel, SignalR hub, Serilog logging
- **AI Integration**: Azure OpenAI with QuizPlugin architecture and intelligent fallback mechanisms
- **Real-time Communication**: SignalR with automatic reconnection and comprehensive error handling
- **Testing**: Playwright E2E tests covering functionality, responsiveness, accessibility, and SignalR integration
- **Dependency Injection**: Singleton pattern for consistent service instances across controllers and SignalR hubs

## ✨ Features

- **Real-time Chat Interface** with typing indicators and message history
- **Azure OpenAI Integration** with gpt-4o deployment and function calling
- **Advanced Quiz System** with interactive features:
  - Multi-category quiz selection (Programming, JavaScript, HTML, CSS, Linux, DevOps, etc.)
  - Multiple choice questions with A/B/C/D answer recognition
  - Real-time score tracking and progress indicators
  - Educational explanations for incorrect answers
  - Final grade calculation and completion metrics
  - Seamless fallback to demo questions when external API unavailable
- **Singleton Architecture** for consistent dependency injection across SignalR hubs and controllers
- **Intelligent Error Handling** with graceful fallbacks and comprehensive logging
- **Mock AI Service** for demonstration when Azure OpenAI is not configured
- **Responsive Design** optimized for desktop, tablet, and mobile devices
- **Automatic Reconnection** handling for robust SignalR connections
- **JSON Response Formatting** allowing natural AI conversation flow
- **Comprehensive Testing** with Playwright E2E tests covering all functionality

## Prerequisites

- .NET 8 SDK
- Node.js (v18 or later)
- npm or yarn
- Azure OpenAI account (optional - falls back to mock service)

## Setup Instructions

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Sematic
```

### 2. Backend Configuration

1. Navigate to the ChatbotApi directory:
   
   ```bash
   cd ChatbotApi
   ```

2. **Configure Azure OpenAI using User Secrets (Recommended):**
   
   ```bash
   # Set Azure OpenAI credentials securely
   dotnet user-secrets set "AzureOpenAI:Endpoint" "https://your-azure-openai-endpoint.openai.azure.com/"
   dotnet user-secrets set "AzureOpenAI:ApiKey" "your-azure-openai-api-key"
   dotnet user-secrets set "AzureOpenAI:DeploymentName" "gpt-4o"
   ```

   **Alternative**: Configure in `appsettings.json` (not recommended for production):
   
   ```json
   {
     "AzureOpenAI": {
       "Endpoint": "https://your-azure-openai-endpoint.openai.azure.com/",
       "ApiKey": "your-azure-openai-api-key",
       "DeploymentName": "gpt-4o",
       "ApiVersion": "2024-02-01"
     }
   }
   ```

   **Note**: If you don't have Azure OpenAI configured, the application will use a mock AI service for demonstration purposes.

3. **QuizAPI Configuration**: The application integrates with QuizAPI.io for real quiz questions. Configure your API key using user secrets:

   ```bash
   # Set QuizAPI.io credentials (replace with your actual API key)
   dotnet user-secrets set "QuizApi:BaseUrl" "https://quizapi.io/api/v1"
   dotnet user-secrets set "QuizApi:ApiKey" "your-quizapi-io-api-key"
   ```

   **Getting a QuizAPI.io API Key:**
   - Visit [QuizAPI.io](https://quizapi.io/)
   - Sign up for a free account
   - Get your API key from the dashboard
   - Free tier includes 100 requests per day

   **Note**: If no QuizAPI key is configured, the application will use fallback quiz questions for demonstration.

4. Restore dependencies:
   
   ```bash
   dotnet restore
   ```

### 3. Frontend Configuration

1. Navigate to the frontend directory:
   ```bash
   cd ../chatbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Option 1: Using VS Code (Recommended)

1. Open the project in VS Code
2. Press `F5` to start debugging
3. Select "Launch Full Stack App" configuration
4. Both backend and frontend will start automatically
5. A browser window will open with the chatbot interface

### Option 2: Manual Start

1. Start the backend API:
   ```bash
   cd ChatbotApi
   dotnet run
   ```
   The API will be available at `https://localhost:7271`

2. In a new terminal, start the frontend:
   ```bash
   cd chatbot-frontend
   npm start
   ```
   The frontend will be available at `http://localhost:4200`

### Option 3: Using the Start Script

```bash
node start-app.js
```

## 🚀 Usage

1. Open your browser and navigate to `http://localhost:4200`
2. The chatbot will greet you with "Hello! I'm your AI assistant. How can I help you today?"
3. Type your message in the input field and press Enter or click Send
4. Wait for the AI response (you'll see a typing indicator)
5. Continue the conversation naturally - the AI supports general chat and quiz functionality

### 🧠 Enhanced Quiz Features

- **Start a Quiz**:
  - Type "start quiz" to see available categories and select one
  - Or type "start programming quiz" to directly start a specific category
  - Available categories: Programming, JavaScript, HTML, CSS, Linux, DevOps, Docker, SQL, and more

- **Interactive Gameplay**:
  - Answer questions by typing single letters (A, B, C, or D)
  - System recognizes both uppercase and lowercase answers
  - Get immediate feedback on your answers

- **Educational Experience**:
  - Receive detailed explanations when you answer incorrectly
  - See the correct answer with full explanation
  - Track your progress throughout the quiz

- **Results & Analytics**:
  - View your final score and percentage
  - Get a letter grade (A, B, C, D, or F)
  - See total completion time
  - Option to start a new quiz in any category

### 💡 AI Assistant Features

- **Natural Conversation**: Engage in general conversation on any topic
- **Function Calling**: The AI can call quiz functions based on your natural language requests
- **Context Awareness**: Maintains conversation context throughout the session
- **Fallback Responses**: Graceful handling when external services are unavailable

## 🔧 Technical Highlights

### Recent Enhancements

- **Azure OpenAI Function Calling**: Implemented `ToolCallBehavior.AutoInvokeKernelFunctions` for seamless AI-to-plugin communication
- **Enhanced Quiz UX**: Category selection workflow with intelligent answer recognition
- **JSON Response Formatting**: Natural AI conversation flow with structured data parsing
- **Comprehensive Error Handling**: Multi-layer fallback mechanisms with detailed logging
- **Singleton Architecture**: Consistent dependency injection across SignalR hubs and controllers
- **SSL Certificate Handling**: Custom validation for development environments
- **Thread-Safe Services**: ConcurrentDictionary and locking patterns for quiz session management

### Key Technical Decisions

- **gpt-4o Deployment**: Latest Azure OpenAI model with advanced function calling capabilities
- **QuizPlugin Architecture**: Semantic Kernel plugin with 6 specialized functions
- **User Secrets**: Secure configuration management for API keys and sensitive data
- **Comprehensive Logging**: Serilog structured logging with multiple levels and outputs
- **Playwright Testing**: Full E2E test coverage including responsive and accessibility testing

## 📁 Project Structure

```text
Sematic/
├── ChatbotApi/                     # .NET Core 8 Web API
│   ├── Controllers/
│   │   └── TestController.cs      # Diagnostic endpoints
│   ├── Hubs/
│   │   └── ChatHub.cs             # SignalR hub with enhanced system prompts
│   ├── Models/
│   │   ├── AzureOpenAISettings.cs # Configuration models
│   │   └── QuizModels.cs          # Quiz domain models
│   ├── Services/
│   │   ├── MockChatCompletionService.cs  # Fallback AI service
│   │   ├── QuizApiService.cs            # External quiz API integration
│   │   ├── QuizSessionService.cs        # Quiz session management
│   │   └── QuizSessionStore.cs          # Thread-safe session storage
│   ├── Plugins/
│   │   └── QuizPlugin.cs          # Semantic Kernel quiz plugin (6 functions)
│   └── Program.cs                 # Main API configuration with singleton services
├── chatbot-frontend/               # Angular 19 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   └── chat/          # Chat component with typing indicators
│   │   │   └── services/
│   │   │       └── chat.service.ts # SignalR client with auto-reconnection
│   │   └── styles.scss            # Responsive SCSS styling
│   ├── e2e/                       # Playwright E2E test suite
│   │   ├── chatbot.spec.ts        # Core functionality tests
│   │   ├── responsive.spec.ts     # Responsive design tests
│   │   ├── signalr.spec.ts        # SignalR integration tests
│   │   ├── accessibility.spec.ts  # Accessibility compliance tests
│   │   ├── quiz.spec.ts           # Quiz functionality tests
│   │   └── test-setup.ts          # Test utilities and fixtures
│   ├── playwright.config.ts       # Multi-browser test configuration
├── .vscode/                       # VS Code workspace configuration
│   ├── launch.json               # Multi-configuration debugging
│   └── tasks.json                # Build and test automation
├── .github/
│   └── copilot-instructions.md   # AI development assistant guidelines
├── start-app.js                  # Development startup script
├── stop-all-processes.ps1        # Process cleanup utilities
└── README.md                     # This comprehensive documentation
```

## Configuration

### Backend (appsettings.json)

```json
{
  "AzureOpenAI": {
    "Endpoint": "your-endpoint",
    "ApiKey": "your-api-key",
    "DeploymentName": "your-model-deployment",
    "ApiVersion": "2024-02-01"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information"
    }
  }
}
```

### Frontend (environment configuration)

The Angular app is configured to connect to:

- API: `https://localhost:7271`
- SignalR Hub: `https://localhost:7271/chathub`

## Logging and Telemetry

### Backend Logging
- Uses Serilog for structured logging
- Logs to console and file (`logs/chatbot-*.txt`)
- Configurable log levels

### Frontend Logging
- Uses NGX-Logger for client-side logging
- Logs user interactions and SignalR events
- Debug information available in browser console

## Debugging

### VS Code Debugging
1. Set breakpoints in your code
2. Press `F5` to start debugging
3. Choose appropriate launch configuration:
   - "Launch Full Stack App": Starts both frontend and backend
   - "Launch .NET API": Starts only the backend
   - "Launch Angular Frontend": Starts only the frontend

### Browser DevTools
- Open browser DevTools to see frontend logs
- Network tab shows SignalR connection status
- Console tab displays chat service logs

## Troubleshooting

### Common Issues

1. **SignalR Connection Failed**
   - Ensure the backend API is running on `https://localhost:7271`
   - Check CORS configuration in Program.cs
   - Verify the frontend is connecting to the correct URL

2. **Azure OpenAI Not Working**
   - Verify your API key and endpoint in appsettings.json
   - Check that your deployment name is correct
   - The app will fall back to mock responses if configuration is invalid

3. **Frontend Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Clear node_modules and reinstall if needed: `rm -rf node_modules && npm install`

4. **Backend Build Errors**
   - Run `dotnet restore` to restore NuGet packages
   - Ensure .NET 8 SDK is installed

5. **QuizAPI Integration Issues**
   - Verify your QuizAPI.io API key is set in user secrets
   - Check that the BaseUrl is correctly set to `https://quizapi.io/api/v1`
   - The app will fall back to demo questions if the API is unreachable
   - Ensure your API key has available quota (free tier: 100 requests/day)

6. **Test Failures**
   - Ensure both backend and frontend are not running when starting E2E tests
   - Check that ports 4200 and 7271 are available
   - Run `npx playwright install` to ensure browser dependencies are installed

## Development

### Adding New Features

1. **Backend**: Add new endpoints or services in the ChatbotApi project
2. **Frontend**: Add new components or services in the Angular app
3. **SignalR**: Extend the ChatHub for new real-time features
4. **Tests**: Add corresponding E2E tests in the `e2e/` directory

## Testing

The project includes comprehensive testing at multiple levels:

### Unit Tests (Angular)

Run Angular unit tests using Karma:

```bash
cd chatbot-frontend
npm run test
```

### End-to-End Tests (Playwright)

The application includes comprehensive E2E tests using Playwright that cover:

- **Core Functionality**: Message sending, AI responses, chat interface
- **Responsive Design**: Desktop, tablet, and mobile layouts
- **SignalR Integration**: Real-time communication, reconnection handling
- **Accessibility**: Keyboard navigation, screen reader support
- **User Experience**: Typing indicators, message history, special characters

#### Running E2E Tests

1. **Run tests in headless mode:**

   ```bash
   cd chatbot-frontend
   npm run e2e
   ```

2. **Run tests with UI (interactive mode):**

   ```bash
   npm run e2e:ui
   ```

3. **Run tests in headed mode (see browser):**

   ```bash
   npm run e2e:headed
   ```

4. **Debug tests step by step:**

   ```bash
   npm run e2e:debug
   ```

5. **Run all tests (unit + e2e):**

   ```bash
   npm run test:all
   ```

#### Test Configuration

- Tests automatically start both backend and frontend servers
- Multiple browser support: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- Automatic screenshots and videos on test failures
- Configurable timeouts and retry logic

#### Test Coverage

The E2E tests cover:

- ✅ Basic chat functionality and UI elements
- ✅ AI greeting message on application load
- ✅ User message sending via button and Enter key
- ✅ AI response reception and display
- ✅ Typing indicators during AI processing
- ✅ Chat history persistence
- ✅ Input validation (disabled send button when empty)
- ✅ Auto-scrolling to latest messages
- ✅ Responsive design across devices
- ✅ SignalR connection establishment and reconnection
- ✅ Special character and emoji handling
- ✅ Long message support
- ✅ Accessibility features and keyboard navigation
- ✅ **Quiz functionality**: Start quiz, answer questions, score tracking, educational explanations
- ✅ **Singleton architecture**: Consistent service instances across all contexts

### Testing Strategy

- **Unit Tests**: Test individual components and services
- **Integration Tests**: Test SignalR connections and API interactions
- **E2E Tests**: Test complete user workflows and scenarios
- **Accessibility Tests**: Ensure compliance with accessibility standards
- **Responsive Tests**: Verify functionality across different devices

## Technical Notes

### QuizAPI Integration

The application integrates with QuizAPI.io for real quiz questions. Key implementation details:

- **URL Construction**: Fixed HttpClient BaseAddress handling for proper API endpoint assembly
  - BaseAddress: `https://quizapi.io/api/v1/` (with trailing slash)
  - Relative paths: `questions`, `categories` (without leading slash)
  - Results in correct URLs: `https://quizapi.io/api/v1/questions`

- **Authentication**: Uses X-Api-Key header for API authentication
- **Fallback Strategy**: Returns demo questions if external API is unavailable
- **Configuration**: API key stored securely in user secrets (not in source control)

### Architecture Decisions

- **Singleton Services**: All services registered as singletons for consistent dependency injection across SignalR hubs and controllers
- **Configuration Management**: User secrets for sensitive data, appsettings.json for non-sensitive configuration
- **Error Handling**: Graceful fallbacks ensure application remains functional even when external services are unavailable

## License

This project is for demonstration purposes. Please ensure you have appropriate licenses for Azure OpenAI and other services used.

## Support

For issues and questions, please check the troubleshooting section above or create an issue in the repository.

# Semantic Chatbot Application

A full-stack chatbot application built with Angular frontend and .NET Core backend, featuring real-time communication via SignalR and AI-powered responses using Azure OpenAI and Microsoft Semantic Kernel.

## Architecture

- **Frontend**: Angular 19 SPA with TypeScript
- **Backend**: .NET Core 8 Web API
- **Real-time Communication**: SignalR
- **AI Integration**: Azure OpenAI with Microsoft Semantic Kernel
- **Logging**: Serilog (backend) and NGX-Logger (frontend)
- **Styling**: SCSS with responsive design

## Features

- Real-time chat interface with typing indicators
- AI-powered responses using Azure OpenAI
- Mock AI service for demo purposes (when Azure OpenAI is not configured)
- Comprehensive logging and telemetry
- Responsive design for desktop and mobile
- Automatic reconnection handling
- Clean, modern UI with message history

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

2. Configure Azure OpenAI settings in `appsettings.json`:
   ```json
   {
     "AzureOpenAI": {
       "Endpoint": "https://your-azure-openai-endpoint.openai.azure.com/",
       "ApiKey": "your-azure-openai-api-key",
       "DeploymentName": "your-deployment-name",
       "ApiVersion": "2024-02-01"
     }
   }
   ```

   **Note**: If you don't have Azure OpenAI configured, the application will use a mock AI service for demonstration purposes.

3. Restore dependencies:
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

## Usage

1. Open your browser and navigate to `http://localhost:4200`
2. The chatbot will greet you with "Hello! I'm your AI assistant. How can I help you today?"
3. Type your message in the input field and press Enter or click Send
4. Wait for the AI response (you'll see a typing indicator)
5. Continue the conversation

## API Endpoints

- **SignalR Hub**: `/chathub`
  - `SendMessage(user, message)`: Send a message to the AI
  - `ReceiveMessage(user, message)`: Receive messages from the AI

## Project Structure

```
Sematic/
├── ChatbotApi/                 # .NET Core Web API
│   ├── Controllers/
│   ├── Hubs/
│   │   └── ChatHub.cs         # SignalR hub for real-time communication
│   ├── Models/
│   │   └── AzureOpenAISettings.cs
│   ├── Services/
│   │   └── MockChatCompletionService.cs
│   └── Program.cs             # Main API configuration
├── chatbot-frontend/          # Angular SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   └── chat/      # Chat component
│   │   │   └── services/
│   │   │       └── chat.service.ts
│   │   └── styles.scss
│   ├── e2e/                   # Playwright E2E tests
│   │   ├── chatbot.spec.ts    # Core functionality tests
│   │   ├── responsive.spec.ts # Responsive design tests
│   │   ├── signalr.spec.ts    # SignalR integration tests
│   │   ├── accessibility.spec.ts # Accessibility tests
│   │   └── test-setup.ts      # Test utilities and fixtures
│   ├── playwright.config.ts   # Playwright configuration
├── .vscode/                   # VS Code configuration
│   ├── launch.json           # Debug configurations
│   └── tasks.json            # Build tasks
├── start-app.js              # Development start script
└── README.md
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

5. **Test Failures**
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

### Testing Strategy

- **Unit Tests**: Test individual components and services
- **Integration Tests**: Test SignalR connections and API interactions
- **E2E Tests**: Test complete user workflows and scenarios
- **Accessibility Tests**: Ensure compliance with accessibility standards
- **Responsive Tests**: Verify functionality across different devices

## License

This project is for demonstration purposes. Please ensure you have appropriate licenses for Azure OpenAI and other services used.

## Support

For issues and questions, please check the troubleshooting section above or create an issue in the repository.

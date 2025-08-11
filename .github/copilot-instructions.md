<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
	<!-- Requirements are clear: Angular SPA frontend with .NET Core Web API backend for chatbot using Azure OpenAI, Semantic Kernel, and SignalR with telemetry logging -->

- [x] Scaffold the Project
	<!-- Created Angular frontend and .NET Core backend project structure manually -->

- [x] Customize the Project
	<!-- Implemented chatbot functionality with SignalR, Azure OpenAI, and Semantic Kernel -->

- [x] Install Required Extensions
	<!-- No specific extensions required - standard Angular and .NET development extensions recommended -->

- [x] Compile the Project
	<!-- Both frontend and backend projects build successfully -->

- [x] Create and Run Task
	<!-- Created VS Code tasks to run both frontend and backend simultaneously -->

- [x] Launch the Project
	<!-- Set up debugging configuration to launch both projects with F5 -->

- [x] Ensure Documentation is Complete
	<!-- Created comprehensive README.md with setup instructions -->

## Project Structure
This is a full-stack chatbot application with:
- Frontend: Angular SPA with SignalR client, responsive design, telemetry logging
- Backend: .NET Core Web API with Azure OpenAI, Semantic Kernel, SignalR hub, and Serilog
- Real-time communication via SignalR
- Mock AI service for demo when Azure OpenAI is not configured
- Comprehensive VS Code debugging setup
- Professional UI with typing indicators and message history

## Usage
Press F5 in VS Code to debug the full application. Both backend and frontend will start automatically, and a browser will open with the chatbot interface. The AI will greet users with "Hello! I'm your AI assistant. How can I help you today?"

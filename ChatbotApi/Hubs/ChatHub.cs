using Microsoft.AspNetCore.SignalR;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Serilog;

namespace ChatbotApi.Hubs
{
    public class ChatHub : Hub
    {
        private readonly Kernel _kernel;
        private readonly IChatCompletionService _chatCompletionService;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(Kernel kernel, IChatCompletionService chatCompletionService, ILogger<ChatHub> logger)
        {
            _kernel = kernel;
            _chatCompletionService = chatCompletionService;
            _logger = logger;
        }

        public async Task SendMessage(string user, string message)
        {
            try
            {
                _logger.LogInformation("Received message from user {User}: {Message}", user, message);

                // Check if message looks like a quiz answer
                var isLikelyQuizAnswer = IsLikelyQuizAnswer(message);
                var contextHint = isLikelyQuizAnswer ? " The user's input appears to be a quiz answer (A, B, C, or D)." : "";

                // Create chat history with enhanced system message for quiz context
                var chatHistory = new ChatHistory();
                chatHistory.AddSystemMessage(@"You are a helpful AI assistant with access to quiz functionality through QuizPlugin functions.

QUIZ INTERACTION RULES:
- When users ask to start a quiz, use StartQuizAsync or GetAvailableCategoriesAsync
- When a user provides a single letter (A, B, C, or D) as input, this is ALWAYS a quiz answer - use SubmitAnswerAsync 
- If the user says 'a', 'b', 'c', 'd' (case insensitive), treat it as a quiz answer submission
- When users ask for quiz status, use GetQuizStatusAsync
- When users want to end a quiz, use EndQuizAsync

ANSWER RECOGNITION: 
Single letter inputs like 'a', 'A', 'b', 'B', 'c', 'C', 'd', 'D' should ALWAYS be treated as quiz answers if there might be an active quiz.

JSON RESPONSE FORMATTING:
When quiz functions return JSON data, parse and format it naturally for the user:
- For incorrect answers: Show the correct answer clearly (e.g., 'The correct answer was B) Linux kernel')
- For quiz completion: Display final scores and grades in a user-friendly way
- For quiz continuation: Present the next question with clear A/B/C/D options
- Always format quiz data in an engaging, readable way rather than showing raw JSON

Be concise and friendly in your responses. Always use the appropriate QuizPlugin functions for quiz-related interactions." + contextHint);
                chatHistory.AddUserMessage(message);

                string responseContent;
                try
                {
                    // Create execution settings to enable function calling
                    var executionSettings = new Microsoft.SemanticKernel.Connectors.OpenAI.OpenAIPromptExecutionSettings
                    {
                        ToolCallBehavior = Microsoft.SemanticKernel.Connectors.OpenAI.ToolCallBehavior.AutoInvokeKernelFunctions
                    };

                    // Use the injected chat completion service with kernel and settings
                    var response = await _chatCompletionService.GetChatMessageContentAsync(
                        chatHistory, 
                        executionSettings, 
                        _kernel);
                    responseContent = response.Content ?? "I'm sorry, I couldn't generate a response.";
                    _logger.LogInformation("AI response generated for user {User}", user);
                }
                catch (Microsoft.SemanticKernel.HttpOperationException httpEx)
                {
                    _logger.LogWarning(httpEx, "Azure OpenAI HTTP error for user {User}. Using fallback response.", user);
                    responseContent = GenerateFallbackResponse(message);
                }
                catch (System.Net.Http.HttpRequestException httpReqEx) 
                {
                    _logger.LogWarning(httpReqEx, "HTTP request error for user {User}. Using fallback response.", user);
                    responseContent = GenerateFallbackResponse(message);
                }
                catch (Exception serviceEx)
                {
                    _logger.LogWarning(serviceEx, "Chat completion service error for user {User}. Using fallback response.", user);
                    responseContent = GenerateFallbackResponse(message);
                }

                // Send response back to the client
                await Clients.Caller.SendAsync("ReceiveMessage", "Assistant", responseContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message from user {User}", user);
                await Clients.Caller.SendAsync("ReceiveMessage", "System", "I'm sorry, I encountered an error processing your message. Please try again.");
            }
        }

        private string GenerateFallbackResponse(string message)
        {
            var lowerMessage = message.ToLowerInvariant();
            
            // Simple pattern matching for common questions
            if (lowerMessage.Contains("captain kirk") || lowerMessage.Contains("kirk"))
            {
                return "Captain James T. Kirk is the iconic captain of the USS Enterprise in the original Star Trek series, played by William Shatner. He's known for his bold leadership, diplomatic skills, and his famous split infinitive: 'to boldly go where no one has gone before.'";
            }
            else if (lowerMessage.Contains("quiz"))
            {
                return "I can help you with quizzes! You can ask me to start a quiz on various topics like JavaScript, Python, or general knowledge. Just say something like 'start a JavaScript quiz' to begin.";
            }
            else if (lowerMessage.Contains("hello") || lowerMessage.Contains("hi"))
            {
                return "Hello! I'm your AI assistant. I can help answer questions and provide quiz functionality. How can I assist you today?";
            }
            else
            {
                return $"I understand you're asking about '{message}'. I'm currently running in offline mode due to connectivity issues, but I'm still here to help with basic questions and quiz functionality. Please try again or ask something else!";
            }
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
            
            // Send welcome message
            await Clients.Caller.SendAsync("ReceiveMessage", "Assistant", "Hello! I'm your AI assistant. How can I help you today?");
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        private bool IsLikelyQuizAnswer(string message)
        {
            var trimmed = message.Trim().ToLowerInvariant();
            return trimmed.Length == 1 && (trimmed == "a" || trimmed == "b" || trimmed == "c" || trimmed == "d");
        }
    }
}

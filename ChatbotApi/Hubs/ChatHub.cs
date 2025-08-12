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

                // Create chat history with system message that includes plugin instructions
                var chatHistory = new ChatHistory();
                chatHistory.AddSystemMessage(@"You are a helpful AI assistant with access to quiz functionality. 
When users ask to start a quiz or interact with quizzes, use the available quiz functions.
For quiz-related requests, always use the QuizPlugin functions.
Be concise and friendly in your responses.");
                chatHistory.AddUserMessage(message);

                string responseContent;
                try
                {
                    // Use the injected chat completion service
                    var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory);
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
    }
}

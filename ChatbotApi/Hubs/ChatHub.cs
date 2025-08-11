using Microsoft.AspNetCore.SignalR;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
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

                // Create chat history
                var chatHistory = new ChatHistory();
                chatHistory.AddSystemMessage("You are a helpful AI assistant. Be concise and friendly in your responses.");
                chatHistory.AddUserMessage(message);

                // Get AI response
                var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory);

                _logger.LogInformation("AI response generated for user {User}", user);

                // Send response back to the client
                await Clients.Caller.SendAsync("ReceiveMessage", "Assistant", response.Content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message from user {User}", user);
                await Clients.Caller.SendAsync("ReceiveMessage", "System", "I'm sorry, I encountered an error processing your message. Please try again.");
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

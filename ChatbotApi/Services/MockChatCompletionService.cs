using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using System.Runtime.CompilerServices;

namespace ChatbotApi.Services
{
    public class MockChatCompletionService : IChatCompletionService
    {
        private readonly ILogger<MockChatCompletionService> _logger;
        private readonly string[] _responses = new[]
        {
            "Hello! I'm a mock AI assistant. I'm here to help you test the chatbot functionality.",
            "That's an interesting question! In a real implementation, I would use Azure OpenAI to provide intelligent responses.",
            "I'm currently running in demo mode. To use real AI responses, please configure your Azure OpenAI settings in appsettings.json.",
            "Thank you for testing the chatbot! The SignalR connection is working properly.",
            "I can see that the real-time communication is functioning well. Great job setting up the infrastructure!"
        };

        public IReadOnlyDictionary<string, object?> Attributes => new Dictionary<string, object?>();

        public MockChatCompletionService(ILogger<MockChatCompletionService> logger)
        {
            _logger = logger;
        }

        public async Task<IReadOnlyList<ChatMessageContent>> GetChatMessageContentsAsync(ChatHistory chatHistory, PromptExecutionSettings? executionSettings = null, Kernel? kernel = null, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Mock chat completion service called");
            
            // Simulate some processing delay
            await Task.Delay(1000, cancellationToken);
            
            var lastMessage = chatHistory.LastOrDefault()?.Content ?? "";
            var response = GenerateMockResponse(lastMessage);
            
            return new List<ChatMessageContent>
            {
                new ChatMessageContent(AuthorRole.Assistant, response)
            };
        }

        public async Task<ChatMessageContent> GetChatMessageContentAsync(ChatHistory chatHistory, PromptExecutionSettings? executionSettings = null, Kernel? kernel = null, CancellationToken cancellationToken = default)
        {
            var results = await GetChatMessageContentsAsync(chatHistory, executionSettings, kernel, cancellationToken);
            return results.First();
        }

        public async IAsyncEnumerable<StreamingChatMessageContent> GetStreamingChatMessageContentsAsync(ChatHistory chatHistory, PromptExecutionSettings? executionSettings = null, Kernel? kernel = null, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var response = GenerateMockResponse(chatHistory.LastOrDefault()?.Content ?? "");
            
            // Simulate streaming by yielding one word at a time
            var words = response.Split(' ');
            foreach (var word in words)
            {
                await Task.Delay(100, cancellationToken);
                yield return new StreamingChatMessageContent(AuthorRole.Assistant, word + " ");
            }
        }

        private string GenerateMockResponse(string userMessage)
        {
            if (string.IsNullOrEmpty(userMessage))
                return _responses[0];

            userMessage = userMessage.ToLowerInvariant();
            
            if (userMessage.Contains("hello") || userMessage.Contains("hi"))
                return "Hello! How can I assist you today?";
            
            if (userMessage.Contains("how are you"))
                return "I'm doing well, thank you for asking! I'm a mock AI assistant ready to help.";
            
            if (userMessage.Contains("what") && userMessage.Contains("do"))
                return "I'm a demo chatbot built with .NET Core, SignalR, and Angular. In production, I would be powered by Azure OpenAI!";
            
            if (userMessage.Contains("bye") || userMessage.Contains("goodbye"))
                return "Goodbye! Thanks for testing the chatbot. Have a great day!";
            
            // Return a random response for other messages
            var random = new Random();
            return _responses[random.Next(_responses.Length)];
        }
    }
}

using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using System.Runtime.CompilerServices;
using System.Text.Json;

namespace ChatbotApi.Services
{
    public class MockChatCompletionService : IChatCompletionService
    {
        private readonly ILogger<MockChatCompletionService> _logger;
        private readonly Kernel _kernel;
        
        private readonly string[] _responses = new[]
        {
            "Hello! I'm your AI assistant. I can help you with various tasks including starting quiz games!",
            "That's an interesting question! I can help you with quizzes, general knowledge, and more.",
            "I'm currently running in demo mode with quiz functionality. Try saying 'start quiz' to begin a quiz game!",
            "Thank you for testing the chatbot! I can create quizzes on various topics like JavaScript, HTML, CSS, Python, and more.",
            "Great! The real-time communication is working. Want to test your knowledge? Say 'quiz me' to start a quiz!"
        };

        public IReadOnlyDictionary<string, object?> Attributes => new Dictionary<string, object?>();

        public MockChatCompletionService(ILogger<MockChatCompletionService> logger, Kernel kernel)
        {
            _logger = logger;
            _kernel = kernel;
            
            // Debug the kernel immediately when service is created
            _logger.LogInformation("MockChatCompletionService created with kernel having {PluginCount} plugins", kernel.Plugins.Count);
            _logger.LogInformation("MockChatCompletionService Kernel instance ID: {KernelId}", kernel.GetHashCode());
            foreach (var plugin in kernel.Plugins)
            {
                _logger.LogInformation("Plugin '{PluginName}' has {FunctionCount} functions:", plugin.Name, plugin.Count());
                foreach (var func in plugin)
                {
                    _logger.LogInformation("  Function: {FunctionName}", func.Name);
                }
            }
        }

        public async Task<IReadOnlyList<ChatMessageContent>> GetChatMessageContentsAsync(ChatHistory chatHistory, PromptExecutionSettings? executionSettings = null, Kernel? kernel = null, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Mock chat completion service called");
            
            // Simulate some processing delay
            await Task.Delay(1000, cancellationToken);
            
            var lastMessage = chatHistory.LastOrDefault()?.Content ?? "";
            var response = await GenerateResponseAsync(lastMessage, kernel ?? _kernel);
            
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
            var response = await GenerateResponseAsync(chatHistory.LastOrDefault()?.Content ?? "", kernel ?? _kernel);
            
            // Simulate streaming by yielding one word at a time
            var words = response.Split(' ');
            foreach (var word in words)
            {
                await Task.Delay(50, cancellationToken);
                yield return new StreamingChatMessageContent(AuthorRole.Assistant, word + " ");
            }
        }

        private async Task<string> GenerateResponseAsync(string userMessage, Kernel kernel)
        {
            if (string.IsNullOrEmpty(userMessage))
                return "Hello! I'm your AI assistant. How can I help you today? 🤖\n\n💡 Try saying:\n• 'start quiz' to begin a quiz game\n• 'quiz me' for a quick challenge\n• 'quiz categories' to see available topics";

            var message = userMessage.ToLowerInvariant().Trim();
            
            // Handle quiz-related requests using the QuizPlugin
            if (IsQuizRelated(message))
            {
                return await HandleQuizRequestAsync(message, userMessage, kernel);
            }
            
            // Handle greeting
            if (message.Contains("hello") || message.Contains("hi") || message.Contains("hey"))
                return "Hello! I'm your AI assistant. How can I help you today? 🤖\n\n💡 Want to test your knowledge? Try saying 'start quiz' or 'quiz me'!";
            
            // Handle general questions about capabilities
            if (message.Contains("what") && (message.Contains("do") || message.Contains("can")))
                return "I can help you with various tasks! 🚀\n\n✨ **My capabilities:**\n• 🎯 **Quiz Games** - Test your knowledge on various topics\n• 💬 **Chat** - Have conversations and ask questions\n• 📚 **Learning** - Help with educational content\n\n💡 Try saying 'start quiz JavaScript' or 'quiz categories' to explore!";
            
            // Handle how are you
            if (message.Contains("how are you") || message.Contains("how do you do"))
                return "I'm doing great, thank you for asking! 😊 I'm excited to help you learn and have fun with quizzes. Ready for a challenge?";
            
            // Handle goodbye
            if (message.Contains("bye") || message.Contains("goodbye") || message.Contains("see you"))
                return "Goodbye! Thanks for chatting with me. Come back anytime for more quizzes and fun! 👋 Have a great day!";
            
            // Handle help requests
            if (message.Contains("help") || message.Contains("commands") || message.Contains("what can"))
                return "🆘 **Here's how I can help:**\n\n🎯 **Quiz Commands:**\n• 'start quiz' - Begin a random quiz\n• 'start quiz [topic]' - Quiz on specific topic (e.g., 'start quiz JavaScript')\n• 'quiz categories' - See available topics\n• 'quiz status' - Check current quiz progress\n• 'end quiz' - Stop current quiz\n\n📝 **During Quiz:**\n• Type A, B, C, or D to answer questions\n\n💡 Just ask me anything or start a quiz to test your knowledge!";
            
            // Return a contextual response
            return GenerateContextualResponse(userMessage);
        }

        private bool IsQuizRelated(string message)
        {
            var quizKeywords = new[] { "quiz", "test", "question", "answer", "start", "begin", "categories", "status", "end", "stop" };
            var answerKeywords = new[] { "a", "b", "c", "d" };
            
            // Check for quiz keywords
            if (quizKeywords.Any(keyword => message.Contains(keyword)))
                return true;
            
            // Check for single letter answers (likely quiz answers)
            if (message.Length <= 2 && answerKeywords.Contains(message))
                return true;
            
            return false;
        }

        private async Task<string> HandleQuizRequestAsync(string lowerMessage, string originalMessage, Kernel kernel)
        {
            try
            {
                var userId = "demo-user"; // In a real app, this would come from the user context
                
                // Debug: Log all available plugins and functions
                _logger.LogInformation("HandleQuizRequestAsync - Available plugins in kernel: {PluginCount}", kernel.Plugins.Count);
                _logger.LogInformation("HandleQuizRequestAsync - Kernel instance ID: {KernelId}", kernel.GetHashCode());
                _logger.LogInformation("HandleQuizRequestAsync - _kernel instance ID: {InternalKernelId}", _kernel.GetHashCode());
                _logger.LogInformation("HandleQuizRequestAsync - Are kernels same instance? {SameInstance}", ReferenceEquals(kernel, _kernel));
                
                foreach (var plugin in kernel.Plugins)
                {
                    _logger.LogInformation("Plugin '{PluginName}' has {FunctionCount} functions:", plugin.Name, plugin.Count());
                    foreach (var func in plugin)
                    {
                        _logger.LogInformation("  Function: {FunctionName}", func.Name);
                    }
                }
                
                // Check if QuizPlugin is available
                if (!kernel.Plugins.TryGetFunction("QuizPlugin", "GetAvailableCategoriesAsync", out var testFunction))
                {
                    _logger.LogWarning("QuizPlugin functions not found in kernel - using provided kernel parameter");
                    
                    // Try with _kernel instance
                    if (!_kernel.Plugins.TryGetFunction("QuizPlugin", "GetAvailableCategoriesAsync", out testFunction))
                    {
                        _logger.LogWarning("QuizPlugin functions not found in _kernel instance either");
                        return "🎯 Quiz functionality is being set up. The quiz features include:\n" +
                               "• Multiple choice questions on various topics\n" +
                               "• Programming, web development, and general knowledge\n" +
                               "• Difficulty levels: Easy, Medium, Hard\n" +
                               "• Score tracking and performance feedback\n\n" +
                               "💡 Quiz functionality will be available once the backend is fully configured!";
                    }
                    else
                    {
                        _logger.LogInformation("Using _kernel instance instead of provided kernel parameter");
                        kernel = _kernel; // Use the instance kernel instead
                    }
                }
                
                // Handle quiz categories request
                if (lowerMessage.Contains("categories") || lowerMessage.Contains("topics"))
                {
                    var categoriesFunction = kernel.Plugins["QuizPlugin"]["GetAvailableCategoriesAsync"];
                    var categoriesResult = await kernel.InvokeAsync(categoriesFunction);
                    return categoriesResult.ToString();
                }
                
                // Handle quiz status request
                if (lowerMessage.Contains("status") || lowerMessage.Contains("progress"))
                {
                    var statusFunction = kernel.Plugins["QuizPlugin"]["GetQuizStatusAsync"];
                    var statusResult = await kernel.InvokeAsync(statusFunction, new() { ["userId"] = userId });
                    return statusResult.ToString();
                }
                
                // Handle end quiz request
                if (lowerMessage.Contains("end") || lowerMessage.Contains("stop") || lowerMessage.Contains("quit"))
                {
                    var endFunction = kernel.Plugins["QuizPlugin"]["EndQuizAsync"];
                    var endResult = await kernel.InvokeAsync(endFunction, new() { ["userId"] = userId });
                    return endResult.ToString();
                }
                
                // Handle quiz start requests
                if (lowerMessage.Contains("start") || lowerMessage.Contains("begin") || lowerMessage.Contains("quiz me"))
                {
                    var category = ExtractCategory(originalMessage);
                    var difficulty = ExtractDifficulty(originalMessage);
                    var questionCount = ExtractQuestionCount(originalMessage);
                    
                    var startFunction = kernel.Plugins["QuizPlugin"]["StartQuizAsync"];
                    var arguments = new KernelArguments
                    {
                        ["userId"] = userId,
                        ["category"] = category,
                        ["difficulty"] = difficulty,
                        ["questionCount"] = questionCount
                    };
                    
                    var startResult = await kernel.InvokeAsync(startFunction, arguments);
                    return startResult.ToString();
                }
                
                // Handle quiz answers (single letters)
                if (lowerMessage.Length <= 2 && new[] { "a", "b", "c", "d" }.Contains(lowerMessage))
                {
                    var answerFunction = kernel.Plugins["QuizPlugin"]["SubmitAnswerAsync"];
                    var answerResult = await kernel.InvokeAsync(answerFunction, new() 
                    { 
                        ["userId"] = userId, 
                        ["answer"] = lowerMessage.ToUpper() 
                    });
                    return answerResult.ToString();
                }
                
                // Default quiz response
                return "🎯 I can help you with quizzes! Try:\n• 'start quiz' for a random quiz\n• 'start quiz JavaScript' for a specific topic\n• 'quiz categories' to see available topics";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling quiz request: {Message}", originalMessage);
                return "🔧 I encountered an issue with the quiz functionality. Please try again or say 'help' for assistance.";
            }
        }

        private string? ExtractCategory(string message)
        {
            var categories = new[] { "javascript", "html", "css", "python", "java", "sql", "linux", "devops", "docker", "programming", "code" };
            var lowerMessage = message.ToLowerInvariant();
            
            foreach (var category in categories)
            {
                if (lowerMessage.Contains(category))
                {
                    return char.ToUpper(category[0]) + category[1..]; // Capitalize first letter
                }
            }
            
            return null;
        }

        private string? ExtractDifficulty(string message)
        {
            var lowerMessage = message.ToLowerInvariant();
            
            if (lowerMessage.Contains("easy")) return "Easy";
            if (lowerMessage.Contains("medium")) return "Medium";
            if (lowerMessage.Contains("hard")) return "Hard";
            
            return null;
        }

        private int ExtractQuestionCount(string message)
        {
            var words = message.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            
            foreach (var word in words)
            {
                if (int.TryParse(word, out var count) && count >= 1 && count <= 20)
                {
                    return count;
                }
            }
            
            return 5; // Default
        }

        private string GenerateContextualResponse(string userMessage)
        {
            var random = new Random();
            var baseResponse = _responses[random.Next(_responses.Length)];
            
            // Add quiz suggestion based on message content
            if (userMessage.ToLowerInvariant().Contains("learn") || userMessage.ToLowerInvariant().Contains("study"))
            {
                return baseResponse + "\n\n🎓 Want to test your knowledge? Try starting a quiz on your favorite topic!";
            }
            
            if (userMessage.ToLowerInvariant().Contains("program") || userMessage.ToLowerInvariant().Contains("code"))
            {
                return baseResponse + "\n\n💻 I can quiz you on programming topics like JavaScript, Python, HTML, CSS, and more!";
            }
            
            return baseResponse + "\n\n💡 Try saying 'start quiz' for a fun knowledge challenge!";
        }
    }
}

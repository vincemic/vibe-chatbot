using ChatbotApi.Models;
using System.Text.Json;

namespace ChatbotApi.Services
{
    public interface IQuizApiService
    {
        Task<List<QuizQuestion>> GetQuestionsAsync(QuizStartRequest request);
        Task<Dictionary<string, object>> GetCategoriesAsync();
    }

    // Thread-safe singleton service for Quiz API operations
    public class QuizApiService : IQuizApiService
    {
        private readonly HttpClient _httpClient;
        private readonly QuizApiSettings _settings;
        private readonly ILogger<QuizApiService> _logger;
        private readonly object _lock = new object();

        public QuizApiService(HttpClient httpClient, QuizApiSettings settings, ILogger<QuizApiService> logger)
        {
            _httpClient = httpClient;
            _settings = settings;
            _logger = logger;
            
            // Log the configuration being used
            _logger.LogInformation("QuizApiService initialized with BaseUrl: {BaseUrl}, HasApiKey: {HasApiKey}", 
                _settings.BaseUrl, !string.IsNullOrEmpty(_settings.ApiKey));
            
            // Configure HttpClient in thread-safe manner
            lock (_lock)
            {
                if (_httpClient.BaseAddress == null)
                {
                    var baseUrl = _settings.BaseUrl.TrimEnd('/') + "/";
                    _httpClient.BaseAddress = new Uri(baseUrl);
                    if (!string.IsNullOrEmpty(_settings.ApiKey))
                    {
                        _httpClient.DefaultRequestHeaders.Add("X-Api-Key", _settings.ApiKey);
                        _logger.LogInformation("API Key header added to HttpClient");
                    }
                    else
                    {
                        _logger.LogWarning("No API Key provided for QuizAPI service");
                    }
                    
                    _logger.LogInformation("HttpClient configured with BaseAddress: {BaseAddress}", _httpClient.BaseAddress);
                }
            }
        }

        public async Task<List<QuizQuestion>> GetQuestionsAsync(QuizStartRequest request)
        {
            try
            {
                _logger.LogInformation("=== Starting GetQuestionsAsync ===");
                _logger.LogInformation("HttpClient BaseAddress: {BaseAddress}", _httpClient.BaseAddress);
                
                var queryParams = new List<string>();
                
                if (!string.IsNullOrEmpty(request.Category))
                    queryParams.Add($"category={Uri.EscapeDataString(request.Category)}");
                
                if (!string.IsNullOrEmpty(request.Difficulty))
                    queryParams.Add($"difficulty={Uri.EscapeDataString(request.Difficulty)}");
                
                if (request.Limit > 0)
                    queryParams.Add($"limit={request.Limit}");
                
                if (!string.IsNullOrEmpty(request.Tags))
                    queryParams.Add($"tags={Uri.EscapeDataString(request.Tags)}");

                var queryString = queryParams.Count > 0 ? "?" + string.Join("&", queryParams) : "";
                var endpoint = $"questions{queryString}";

                _logger.LogInformation("Fetching quiz questions from endpoint: {Endpoint}", endpoint);
                _logger.LogInformation("Full URL will be: {BaseAddress}{Endpoint}", _httpClient.BaseAddress, endpoint);
                _logger.LogInformation("Making HTTP GET request...");

                var response = await _httpClient.GetAsync(endpoint);
                
                _logger.LogInformation("HTTP Response Status: {StatusCode}", response.StatusCode);
                _logger.LogInformation("HTTP Response Headers: {Headers}", response.Headers);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Quiz API request failed with status: {StatusCode}, Response: {Response}", response.StatusCode, errorContent);
                    _logger.LogInformation("=== Returning fallback questions ===");
                    return GetFallbackQuestions();
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Quiz API response length: {Length} characters", jsonContent?.Length ?? 0);
                _logger.LogDebug("Quiz API response: {Response}", jsonContent);

                var questions = JsonSerializer.Deserialize<List<QuizQuestion>>(jsonContent ?? "", new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation("Successfully parsed {Count} questions from API", questions?.Count ?? 0);
                _logger.LogInformation("=== Returning API questions ===");
                return questions ?? GetFallbackQuestions();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception in GetQuestionsAsync: {Message}", ex.Message);
                _logger.LogInformation("=== Returning fallback questions due to exception ===");
                return GetFallbackQuestions();
            }
        }

        public async Task<Dictionary<string, object>> GetCategoriesAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("categories");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Categories API request failed with status: {StatusCode}", response.StatusCode);
                    return GetFallbackCategories();
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                var categories = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return categories ?? GetFallbackCategories();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching categories from API");
                return GetFallbackCategories();
            }
        }

        private List<QuizQuestion> GetFallbackQuestions()
        {
            return new List<QuizQuestion>
            {
                new QuizQuestion
                {
                    Id = 1,
                    Question = "What does HTML stand for?",
                    Answers = new Dictionary<string, string?>
                    {
                        { "answer_a", "HyperText Markup Language" },
                        { "answer_b", "High Tech Modern Language" },
                        { "answer_c", "Home Tool Markup Language" },
                        { "answer_d", "Hyperlink and Text Markup Language" }
                    },
                    CorrectAnswers = new Dictionary<string, string>
                    {
                        { "answer_a_correct", "true" },
                        { "answer_b_correct", "false" },
                        { "answer_c_correct", "false" },
                        { "answer_d_correct", "false" }
                    },
                    Category = "HTML",
                    Difficulty = "Easy",
                    Explanation = "HTML stands for HyperText Markup Language, which is the standard markup language for creating web pages."
                },
                new QuizQuestion
                {
                    Id = 2,
                    Question = "Which of the following is NOT a programming language?",
                    Answers = new Dictionary<string, string?>
                    {
                        { "answer_a", "Python" },
                        { "answer_b", "JavaScript" },
                        { "answer_c", "HTML" },
                        { "answer_d", "Java" }
                    },
                    CorrectAnswers = new Dictionary<string, string>
                    {
                        { "answer_a_correct", "false" },
                        { "answer_b_correct", "false" },
                        { "answer_c_correct", "true" },
                        { "answer_d_correct", "false" }
                    },
                    Category = "Programming",
                    Difficulty = "Easy",
                    Explanation = "HTML is a markup language, not a programming language. It's used for structuring web content."
                },
                new QuizQuestion
                {
                    Id = 3,
                    Question = "What does CSS stand for?",
                    Answers = new Dictionary<string, string?>
                    {
                        { "answer_a", "Computer Style Sheets" },
                        { "answer_b", "Cascading Style Sheets" },
                        { "answer_c", "Creative Style Sheets" },
                        { "answer_d", "Colorful Style Sheets" }
                    },
                    CorrectAnswers = new Dictionary<string, string>
                    {
                        { "answer_a_correct", "false" },
                        { "answer_b_correct", "true" },
                        { "answer_c_correct", "false" },
                        { "answer_d_correct", "false" }
                    },
                    Category = "CSS",
                    Difficulty = "Easy",
                    Explanation = "CSS stands for Cascading Style Sheets, used for styling HTML elements."
                }
            };
        }

        private Dictionary<string, object> GetFallbackCategories()
        {
            return new Dictionary<string, object>
            {
                { "Linux", "Linux" },
                { "DevOps", "DevOps" },
                { "Docker", "Docker" },
                { "SQL", "SQL" },
                { "CMS", "CMS" },
                { "Code", "Code" },
                { "HTML", "HTML" },
                { "CSS", "CSS" },
                { "JavaScript", "JavaScript" },
                { "Programming", "Programming" }
            };
        }
    }
}

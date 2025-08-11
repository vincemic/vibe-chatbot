using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using ChatbotApi.Models;
using ChatbotApi.Services;

namespace ChatbotApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly ILogger<TestController> _logger;
        private readonly IServiceProvider _serviceProvider;

        public TestController(ILogger<TestController> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        [HttpGet("plugins")]
        public IActionResult GetPlugins()
        {
            try
            {
                _logger.LogInformation("Test endpoint called successfully");
                
                // Try to get the Kernel service
                try
                {
                    var kernel = _serviceProvider.GetRequiredService<Kernel>();
                    _logger.LogInformation("TestController - Kernel retrieved successfully");
                    _logger.LogInformation("TestController - Kernel instance ID: {KernelId}", kernel.GetHashCode());
                    
                    var result = new
                    {
                        Message = "Kernel found",
                        PluginCount = kernel.Plugins.Count,
                        KernelInstanceId = kernel.GetHashCode(),
                        Plugins = kernel.Plugins.Select(p => new
                        {
                            Name = p.Name,
                            FunctionCount = p.Count(),
                            Functions = p.Select(f => f.Name).ToList()
                        }).ToList(),
                        Timestamp = DateTime.UtcNow
                    };
                    
                    return Ok(result);
                }
                catch (Exception kernelEx)
                {
                    _logger.LogError(kernelEx, "Failed to retrieve Kernel service");
                    return Ok(new { 
                        Message = "Kernel not available", 
                        Error = kernelEx.Message,
                        Timestamp = DateTime.UtcNow 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in test endpoint");
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("config")]
        public IActionResult GetConfig()
        {
            try
            {
                // Get QuizAPI configuration
                var quizApiService = _serviceProvider.GetService<IQuizApiService>();
                var httpClientFactory = _serviceProvider.GetService<IHttpClientFactory>();
                
                // Try to get the settings from configuration
                var configuration = _serviceProvider.GetService<IConfiguration>();
                var quizApiSection = configuration?.GetSection("QuizApi");
                
                var result = new
                {
                    Message = "Configuration check",
                    QuizApi = new
                    {
                        BaseUrl = quizApiSection?.GetValue<string>("BaseUrl"),
                        HasApiKey = !string.IsNullOrEmpty(quizApiSection?.GetValue<string>("ApiKey")),
                        ApiKeyLength = quizApiSection?.GetValue<string>("ApiKey")?.Length ?? 0
                    },
                    Services = new
                    {
                        HasQuizApiService = quizApiService != null,
                        HasHttpClientFactory = httpClientFactory != null
                    },
                    Timestamp = DateTime.UtcNow
                };
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting configuration");
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpPost("quiz")]
        public async Task<IActionResult> TestQuiz()
        {
            try
            {
                var quizApiService = _serviceProvider.GetRequiredService<IQuizApiService>();
                
                _logger.LogInformation("Testing quiz API with current configuration");

                var request = new QuizStartRequest
                {
                    Limit = 1,
                    Category = "JavaScript"
                };

                var questions = await quizApiService.GetQuestionsAsync(request);

                return Ok(new 
                {
                    Success = true,
                    QuestionsCount = questions.Count,
                    Questions = questions,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing quiz API");
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpPost("quiz-direct")]
        public async Task<IActionResult> TestQuizDirect()
        {
            try
            {
                _logger.LogInformation("Testing direct HTTP call to QuizAPI.io");
                
                var configuration = _serviceProvider.GetService<IConfiguration>();
                var apiKey = configuration?.GetValue<string>("QuizApi:ApiKey");
                var baseUrl = configuration?.GetValue<string>("QuizApi:BaseUrl");
                
                _logger.LogInformation("Using BaseUrl: {BaseUrl}, HasApiKey: {HasApiKey}", baseUrl, !string.IsNullOrEmpty(apiKey));
                
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
                
                var url = $"{baseUrl}/questions?limit=1&category=JavaScript";
                _logger.LogInformation("Making direct call to: {Url}", url);
                
                var response = await httpClient.GetAsync(url);
                var content = await response.Content.ReadAsStringAsync();
                
                _logger.LogInformation("Direct API Response Status: {Status}", response.StatusCode);
                _logger.LogInformation("Direct API Response Content Length: {Length}", content?.Length ?? 0);
                
                return Ok(new 
                {
                    Success = response.IsSuccessStatusCode,
                    StatusCode = response.StatusCode,
                    Url = url,
                    ContentLength = content?.Length ?? 0,
                    Content = content,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in direct quiz API test");
                return StatusCode(500, new { Error = ex.Message });
            }
        }
    }
}

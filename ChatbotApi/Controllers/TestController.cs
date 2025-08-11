using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;

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
    }
}

using Microsoft.AspNetCore.Mvc;
using ChatbotApi.Services;
using ChatbotApi.Models;

namespace ChatbotApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PdfController : ControllerBase
    {
        private readonly IPdfToMarkdownService _pdfService;
        private readonly ILogger<PdfController> _logger;

        public PdfController(IPdfToMarkdownService pdfService, ILogger<PdfController> logger)
        {
            _pdfService = pdfService;
            _logger = logger;
        }

        [HttpPost("convert")]
        public async Task<ActionResult<PdfToMarkdownResponse>> ConvertPdfToMarkdown(IFormFile file, [FromForm] bool includeMetadata = false)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = "No file provided"
                });
            }

            if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = "File must be a PDF"
                });
            }

            try
            {
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileContent = memoryStream.ToArray();

                var request = new PdfToMarkdownRequest
                {
                    FileContent = fileContent,
                    FileName = file.FileName,
                    IncludeMetadata = includeMetadata
                };

                var result = await _pdfService.ConvertPdfToMarkdownAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting PDF file: {FileName}", file.FileName);
                return StatusCode(500, new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = "Internal server error during conversion"
                });
            }
        }

        [HttpPost("convert-base64")]
        public async Task<ActionResult<PdfToMarkdownResponse>> ConvertBase64Pdf([FromBody] Base64PdfRequest request)
        {
            if (string.IsNullOrEmpty(request.Base64Content))
            {
                return BadRequest(new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = "Base64 content is required"
                });
            }

            try
            {
                var fileContent = Convert.FromBase64String(request.Base64Content);
                
                var convertRequest = new PdfToMarkdownRequest
                {
                    FileContent = fileContent,
                    FileName = request.FileName ?? "document.pdf",
                    IncludeMetadata = request.IncludeMetadata
                };

                var result = await _pdfService.ConvertPdfToMarkdownAsync(convertRequest);
                return Ok(result);
            }
            catch (FormatException)
            {
                return BadRequest(new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = "Invalid base64 content"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting base64 PDF");
                return StatusCode(500, new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = "Internal server error during conversion"
                });
            }
        }

        [HttpGet("status")]
        public async Task<ActionResult> GetServiceStatus()
        {
            var isAvailable = await _pdfService.IsServiceAvailableAsync();
            
            return Ok(new
            {
                Available = isAvailable,
                Status = isAvailable ? "operational" : "unavailable",
                Message = isAvailable 
                    ? "PDF to Markdown conversion service is ready" 
                    : "PDF conversion service is currently unavailable",
                Timestamp = DateTime.UtcNow
            });
        }

        [HttpGet("test")]
        public async Task<ActionResult> TestPdfService()
        {
            try
            {
                _logger.LogInformation("Testing PDF service functionality");

                // Test service availability
                var isAvailable = await _pdfService.IsServiceAvailableAsync();
                
                // Test with a non-existent file to trigger fallback
                var request = new PdfToMarkdownRequest
                {
                    FilePath = "test-nonexistent.pdf",
                    IncludeMetadata = false
                };

                var result = await _pdfService.ConvertPdfToMarkdownAsync(request);

                return Ok(new
                {
                    ServiceAvailable = isAvailable,
                    TestResult = new
                    {
                        Success = result.Success,
                        ErrorMessage = result.ErrorMessage,
                        HasMarkdownContent = !string.IsNullOrEmpty(result.MarkdownContent),
                        MarkdownPreview = result.MarkdownContent?.Substring(0, Math.Min(200, result.MarkdownContent?.Length ?? 0))
                    },
                    Message = "PDF service test completed successfully",
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during PDF service test");
                return StatusCode(500, new
                {
                    Error = "Test failed",
                    Message = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }
    }

    public class Base64PdfRequest
    {
        public string Base64Content { get; set; } = "";
        public string? FileName { get; set; }
        public bool IncludeMetadata { get; set; } = false;
    }
}

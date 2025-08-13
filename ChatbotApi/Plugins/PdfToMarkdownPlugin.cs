using System.ComponentModel;
using System.Text.Json;
using Microsoft.SemanticKernel;
using ChatbotApi.Models;
using ChatbotApi.Services;

namespace ChatbotApi.Plugins
{
    public class PdfToMarkdownPlugin
    {
        private readonly IPdfToMarkdownService _pdfService;
        private readonly ILogger<PdfToMarkdownPlugin> _logger;

        public PdfToMarkdownPlugin(IPdfToMarkdownService pdfService, ILogger<PdfToMarkdownPlugin> logger)
        {
            _pdfService = pdfService;
            _logger = logger;
        }

        [KernelFunction("convert_pdf_to_markdown")]
        [Description("Converts a PDF file to Markdown format. Accepts file path or base64 encoded content.")]
        public async Task<string> ConvertPdfToMarkdownAsync(
            [Description("File path to the PDF document")] string? filePath = null,
            [Description("Base64 encoded PDF content")] string? base64Content = null,
            [Description("Original filename if using base64 content")] string? fileName = null,
            [Description("Whether to include PDF metadata in the response")] bool includeMetadata = false)
        {
            _logger.LogInformation("PDF conversion requested - FilePath: {FilePath}, FileName: {FileName}", filePath, fileName);

            try
            {
                PdfToMarkdownRequest request;

                if (!string.IsNullOrEmpty(base64Content))
                {
                    var fileContent = Convert.FromBase64String(base64Content);
                    request = new PdfToMarkdownRequest
                    {
                        FileContent = fileContent,
                        FileName = fileName ?? "document.pdf",
                        IncludeMetadata = includeMetadata
                    };
                }
                else if (!string.IsNullOrEmpty(filePath))
                {
                    request = new PdfToMarkdownRequest
                    {
                        FilePath = filePath,
                        IncludeMetadata = includeMetadata
                    };
                }
                else
                {
                    return JsonSerializer.Serialize(new
                    {
                        success = false,
                        error = "Either filePath or base64Content must be provided",
                        markdown = ""
                    });
                }

                var result = await _pdfService.ConvertPdfToMarkdownAsync(request);

                if (result.Success)
                {
                    var response = new
                    {
                        success = true,
                        markdown = result.MarkdownContent ?? "",
                        pageCount = result.PageCount,
                        metadata = includeMetadata ? result.Metadata : null,
                        message = $"Successfully converted PDF to Markdown ({result.PageCount} pages)"
                    };

                    return JsonSerializer.Serialize(response);
                }
                else
                {
                    var errorResponse = new
                    {
                        success = false,
                        error = result.ErrorMessage ?? "Unknown error occurred",
                        markdown = result.MarkdownContent ?? ""
                    };

                    return JsonSerializer.Serialize(errorResponse);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in PDF conversion plugin");
                
                var errorResponse = new
                {
                    success = false,
                    error = $"PDF conversion failed: {ex.Message}",
                    markdown = ""
                };

                return JsonSerializer.Serialize(errorResponse);
            }
        }

        [KernelFunction("check_pdf_service_status")]
        [Description("Checks if the PDF to Markdown conversion service is available and operational.")]
        public async Task<string> CheckPdfServiceStatusAsync()
        {
            _logger.LogInformation("Checking PDF service status");

            try
            {
                var isAvailable = await _pdfService.IsServiceAvailableAsync();
                
                var response = new
                {
                    available = isAvailable,
                    status = isAvailable ? "operational" : "unavailable",
                    message = isAvailable 
                        ? "PDF to Markdown conversion service is ready" 
                        : "PDF conversion service is currently unavailable",
                    timestamp = DateTime.UtcNow
                };

                return JsonSerializer.Serialize(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking PDF service status");
                
                var errorResponse = new
                {
                    available = false,
                    status = "error",
                    message = $"Failed to check service status: {ex.Message}",
                    timestamp = DateTime.UtcNow
                };

                return JsonSerializer.Serialize(errorResponse);
            }
        }

        [KernelFunction("get_pdf_conversion_help")]
        [Description("Provides help and instructions for using the PDF to Markdown conversion functionality.")]
        public string GetPdfConversionHelp()
        {
            var helpInfo = new
            {
                title = "PDF to Markdown Conversion Help",
                description = "This service converts PDF documents to Markdown format for easy reading and processing.",
                usage = new
                {
                    methods = new[]
                    {
                        "Upload a PDF file directly through the chat interface",
                        "Provide a file path to a PDF document",
                        "Send base64 encoded PDF content"
                    },
                    supportedFormats = new[] { "PDF" },
                    outputFormat = "Markdown (.md)",
                    features = new[]
                    {
                        "Text extraction from PDF documents",
                        "Basic formatting preservation", 
                        "Metadata extraction (optional)",
                        "Multi-page document support",
                        "Automatic heading detection"
                    }
                },
                examples = new[]
                {
                    "Upload a PDF file and I'll convert it to Markdown for you",
                    "Say 'convert this PDF to markdown' after uploading a file",
                    "Ask 'check PDF service status' to verify the service is working"
                },
                limitations = new[]
                {
                    "Complex layouts may not be perfectly preserved",
                    "Images and graphics are not extracted",
                    "Tables may require manual formatting adjustment"
                }
            };

            return JsonSerializer.Serialize(helpInfo, new JsonSerializerOptions { WriteIndented = true });
        }
    }
}

using System.Diagnostics;
using System.Text;
using System.Text.Json;
using ChatbotApi.Models;

namespace ChatbotApi.Services
{
    public class PdfToMarkdownService : IPdfToMarkdownService
    {
        private readonly ILogger<PdfToMarkdownService> _logger;
        private readonly object _lock = new object();

        public PdfToMarkdownService(ILogger<PdfToMarkdownService> logger)
        {
            _logger = logger;
            _logger.LogInformation("PdfToMarkdownService initialized");
        }

        public async Task<PdfToMarkdownResponse> ConvertPdfToMarkdownAsync(PdfToMarkdownRequest request)
        {
            _logger.LogInformation("Converting PDF to Markdown - FileName: {FileName}", request.FileName ?? "Unknown");

            try
            {
                if (request.FileContent != null && request.FileContent.Length > 0)
                {
                    return await ConvertPdfFromBytesAsync(request.FileContent, request.FileName ?? "document.pdf", request.IncludeMetadata);
                }
                else if (!string.IsNullOrEmpty(request.FilePath))
                {
                    return await ConvertPdfFromPathAsync(request.FilePath, request.IncludeMetadata);
                }
                else
                {
                    return new PdfToMarkdownResponse
                    {
                        Success = false,
                        ErrorMessage = "Either FilePath or FileContent must be provided"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting PDF to Markdown");
                return new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = $"Conversion failed: {ex.Message}"
                };
            }
        }

        public async Task<PdfToMarkdownResponse> ConvertPdfFromPathAsync(string filePath, bool includeMetadata = false)
        {
            _logger.LogInformation("Converting PDF from path: {FilePath}", filePath);

            if (!File.Exists(filePath))
            {
                return new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = $"File not found: {filePath}"
                };
            }

            try
            {
                var fileContent = await File.ReadAllBytesAsync(filePath);
                var fileName = Path.GetFileName(filePath);
                return await ConvertPdfFromBytesAsync(fileContent, fileName, includeMetadata);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading PDF file: {FilePath}", filePath);
                return new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = $"Error reading file: {ex.Message}"
                };
            }
        }

        public async Task<PdfToMarkdownResponse> ConvertPdfFromBytesAsync(byte[] fileContent, string fileName, bool includeMetadata = false)
        {
            _logger.LogInformation("Converting PDF from bytes - Size: {Size} bytes, FileName: {FileName}", fileContent.Length, fileName);

            try
            {
                // Create a temporary file for the MCP server to process
                var tempFilePath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + ".pdf");
                await File.WriteAllBytesAsync(tempFilePath, fileContent);

                try
                {
                    var result = await CallMcpServerAsync(tempFilePath, includeMetadata);
                    return result;
                }
                finally
                {
                    // Clean up temporary file
                    if (File.Exists(tempFilePath))
                    {
                        try
                        {
                            File.Delete(tempFilePath);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to delete temporary file: {TempFilePath}", tempFilePath);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PDF bytes");
                return new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = $"Processing failed: {ex.Message}"
                };
            }
        }

        private async Task<PdfToMarkdownResponse> CallMcpServerAsync(string filePath, bool includeMetadata)
        {
            try
            {
                // First try with mcp-pdf-server
                var response = await CallPdfServerAsync(filePath, includeMetadata);
                if (response.Success)
                {
                    return response;
                }

                _logger.LogWarning("Primary PDF server failed, trying fallback reader");
                
                // Fallback to pdf-reader-mcp
                return await CallPdfReaderAsync(filePath, includeMetadata);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling MCP server");
                return await GenerateFallbackResponse(filePath);
            }
        }

        private async Task<PdfToMarkdownResponse> CallPdfServerAsync(string filePath, bool includeMetadata)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = $"node_modules/mcp-pdf-server/build/index.js",
                    UseShellExecute = false,
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                    WorkingDirectory = Directory.GetCurrentDirectory()
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    throw new Exception("Failed to start MCP PDF server process");
                }

                // Send MCP request to extract text
                var mcpRequest = new
                {
                    jsonrpc = "2.0",
                    method = "tools/call",
                    @params = new
                    {
                        name = "extract_text",
                        arguments = new
                        {
                            file_path = filePath,
                            include_metadata = includeMetadata
                        }
                    },
                    id = 1
                };

                var requestJson = JsonSerializer.Serialize(mcpRequest);
                await process.StandardInput.WriteLineAsync(requestJson);
                await process.StandardInput.FlushAsync();
                process.StandardInput.Close();

                var responseText = await process.StandardOutput.ReadToEndAsync();
                var errorText = await process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                if (!string.IsNullOrEmpty(errorText))
                {
                    _logger.LogWarning("MCP server stderr: {ErrorText}", errorText);
                }

                if (string.IsNullOrEmpty(responseText))
                {
                    throw new Exception("No response from MCP server");
                }

                var mcpResponse = JsonSerializer.Deserialize<JsonElement>(responseText);
                
                if (mcpResponse.TryGetProperty("result", out var result))
                {
                    var markdownContent = result.TryGetProperty("content", out var content) ? content.GetString() : "";
                    var pageCount = result.TryGetProperty("page_count", out var pages) ? pages.GetInt32() : 0;
                    
                    return new PdfToMarkdownResponse
                    {
                        Success = true,
                        MarkdownContent = markdownContent,
                        PageCount = pageCount
                    };
                }
                else if (mcpResponse.TryGetProperty("error", out var error))
                {
                    var errorMessage = error.TryGetProperty("message", out var msg) ? msg.GetString() : "Unknown error";
                    throw new Exception($"MCP server error: {errorMessage}");
                }

                throw new Exception("Invalid response format from MCP server");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling PDF server");
                return new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private async Task<PdfToMarkdownResponse> CallPdfReaderAsync(string filePath, bool includeMetadata)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = $"node_modules/@sylphlab/pdf-reader-mcp/dist/index.js",
                    UseShellExecute = false,
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                    WorkingDirectory = Directory.GetCurrentDirectory()
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    throw new Exception("Failed to start PDF reader MCP server process");
                }

                var mcpRequest = new
                {
                    jsonrpc = "2.0",
                    method = "tools/call",
                    @params = new
                    {
                        name = "read_pdf",
                        arguments = new
                        {
                            file_path = filePath
                        }
                    },
                    id = 1
                };

                var requestJson = JsonSerializer.Serialize(mcpRequest);
                await process.StandardInput.WriteLineAsync(requestJson);
                await process.StandardInput.FlushAsync();
                process.StandardInput.Close();

                var responseText = await process.StandardOutput.ReadToEndAsync();
                await process.WaitForExitAsync();

                if (string.IsNullOrEmpty(responseText))
                {
                    throw new Exception("No response from PDF reader MCP server");
                }

                var mcpResponse = JsonSerializer.Deserialize<JsonElement>(responseText);
                
                if (mcpResponse.TryGetProperty("result", out var result))
                {
                    var content = result.TryGetProperty("content", out var contentElement) ? contentElement.GetString() : "";
                    
                    // Convert plain text to markdown format
                    var markdownContent = ConvertTextToMarkdown(content ?? "");
                    
                    return new PdfToMarkdownResponse
                    {
                        Success = true,
                        MarkdownContent = markdownContent,
                        PageCount = 1 // PDF reader doesn't provide page count
                    };
                }

                throw new Exception("Invalid response from PDF reader MCP server");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling PDF reader");
                return new PdfToMarkdownResponse
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private string ConvertTextToMarkdown(string text)
        {
            if (string.IsNullOrEmpty(text))
                return "";

            var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var markdown = new StringBuilder();

            foreach (var line in lines)
            {
                var trimmedLine = line.Trim();
                
                if (string.IsNullOrEmpty(trimmedLine))
                    continue;

                // Simple heuristics for markdown conversion
                if (trimmedLine.Length < 80 && !trimmedLine.EndsWith('.') && !trimmedLine.EndsWith(','))
                {
                    // Likely a heading
                    markdown.AppendLine($"## {trimmedLine}");
                }
                else
                {
                    // Regular paragraph
                    markdown.AppendLine(trimmedLine);
                }
                
                markdown.AppendLine();
            }

            return markdown.ToString();
        }

        private Task<PdfToMarkdownResponse> GenerateFallbackResponse(string filePath)
        {
            _logger.LogWarning("Using fallback response for PDF conversion");
            
            var response = new PdfToMarkdownResponse
            {
                Success = false,
                ErrorMessage = "PDF to Markdown conversion service is currently unavailable. Please try again later.",
                MarkdownContent = $"# PDF Conversion Failed\n\nThe PDF file `{Path.GetFileName(filePath)}` could not be processed at this time.\n\n## Possible Solutions\n\n- Ensure the PDF file is not corrupted\n- Try with a different PDF file\n- Contact support if the issue persists"
            };
            
            return Task.FromResult(response);
        }

        public async Task<bool> IsServiceAvailableAsync()
        {
            try
            {
                // Test if Node.js is available
                var startInfo = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = "--version",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process == null) return false;

                await process.WaitForExitAsync();
                return process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }
    }
}

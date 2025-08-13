using ChatbotApi.Models;

namespace ChatbotApi.Services
{
    public interface IPdfToMarkdownService
    {
        Task<PdfToMarkdownResponse> ConvertPdfToMarkdownAsync(PdfToMarkdownRequest request);
        Task<PdfToMarkdownResponse> ConvertPdfFromPathAsync(string filePath, bool includeMetadata = false);
        Task<PdfToMarkdownResponse> ConvertPdfFromBytesAsync(byte[] fileContent, string fileName, bool includeMetadata = false);
        Task<bool> IsServiceAvailableAsync();
    }
}

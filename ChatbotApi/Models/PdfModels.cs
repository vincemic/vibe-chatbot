using System.Text.Json;

namespace ChatbotApi.Models
{
    public class PdfToMarkdownRequest
    {
        public string? FilePath { get; set; }
        public byte[]? FileContent { get; set; }
        public string? FileName { get; set; }
        public bool IncludeMetadata { get; set; } = false;
        public bool PreserveFormatting { get; set; } = true;
    }

    public class PdfToMarkdownResponse
    {
        public bool Success { get; set; }
        public string? MarkdownContent { get; set; }
        public string? ErrorMessage { get; set; }
        public PdfMetadata? Metadata { get; set; }
        public int PageCount { get; set; }
    }

    public class PdfMetadata
    {
        public string? Title { get; set; }
        public string? Author { get; set; }
        public string? Subject { get; set; }
        public string? Creator { get; set; }
        public DateTime? CreationDate { get; set; }
        public DateTime? ModificationDate { get; set; }
        public string? Producer { get; set; }
    }

    public class McpServerResponse
    {
        public string? Type { get; set; }
        public JsonElement? Content { get; set; }
        public bool IsError { get; set; }
        public string? ErrorMessage { get; set; }
    }
}

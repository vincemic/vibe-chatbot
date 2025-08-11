namespace ChatbotApi.Models
{
    public class AzureOpenAISettings
    {
        public string? Endpoint { get; set; }
        public string? ApiKey { get; set; }
        public string? DeploymentName { get; set; }
        public string? ApiVersion { get; set; } = "2024-02-01";
    }
}

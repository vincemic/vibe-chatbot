using Microsoft.SemanticKernel;
using ChatbotApi.Hubs;
using ChatbotApi.Models;
using Serilog;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/chatbot-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

// Add Serilog
builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();

// Add SignalR
builder.Services.AddSignalR();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// Configure Azure OpenAI settings
builder.Services.Configure<AzureOpenAISettings>(
    builder.Configuration.GetSection("AzureOpenAI"));

// Add Semantic Kernel
builder.Services.AddSingleton<Kernel>(serviceProvider =>
{
    var azureOpenAISettings = builder.Configuration.GetSection("AzureOpenAI").Get<AzureOpenAISettings>();
    
    var kernelBuilder = Kernel.CreateBuilder();
    
    if (!string.IsNullOrEmpty(azureOpenAISettings?.Endpoint) && 
        !string.IsNullOrEmpty(azureOpenAISettings?.ApiKey) && 
        !string.IsNullOrEmpty(azureOpenAISettings?.DeploymentName))
    {
        kernelBuilder.AddAzureOpenAIChatCompletion(
            deploymentName: azureOpenAISettings.DeploymentName,
            endpoint: azureOpenAISettings.Endpoint,
            apiKey: azureOpenAISettings.ApiKey);
    }
    else
    {
        // Fallback for demo purposes - in production, you should always use proper configuration
        Log.Warning("Azure OpenAI configuration not found. Using mock responses for demo.");
    }
    
    return kernelBuilder.Build();
});

// Add chat completion service
builder.Services.AddSingleton<Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService>(serviceProvider =>
{
    var azureOpenAISettings = builder.Configuration.GetSection("AzureOpenAI").Get<AzureOpenAISettings>();
    
    if (!string.IsNullOrEmpty(azureOpenAISettings?.Endpoint) && 
        !string.IsNullOrEmpty(azureOpenAISettings?.ApiKey) && 
        !string.IsNullOrEmpty(azureOpenAISettings?.DeploymentName) &&
        azureOpenAISettings.Endpoint != "https://your-azure-openai-endpoint.openai.azure.com/" &&
        azureOpenAISettings.ApiKey != "your-azure-openai-api-key")
    {
        var kernel = serviceProvider.GetRequiredService<Kernel>();
        return kernel.GetRequiredService<Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService>();
    }
    else
    {
        // Use mock service for demo
        var logger = serviceProvider.GetRequiredService<ILogger<ChatbotApi.Services.MockChatCompletionService>>();
        return new ChatbotApi.Services.MockChatCompletionService(logger);
    }
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowAngularApp");

app.UseAuthorization();

app.MapControllers();

// Map SignalR hub
app.MapHub<ChatHub>("/chathub");

try
{
    Log.Information("Starting Chatbot API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

using Microsoft.SemanticKernel;
using ChatbotApi.Hubs;
using ChatbotApi.Models;
using ChatbotApi.Services;
using ChatbotApi.Plugins;
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

// Configure Quiz API settings
builder.Services.Configure<QuizApiSettings>(
    builder.Configuration.GetSection("QuizApi"));

// ALL SERVICES AS SINGLETONS FOR CONSISTENT DEPENDENCY INJECTION
// This ensures the same service instances are used across controllers and SignalR hubs

// Add Quiz services - ALL SINGLETONS
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IQuizApiService>(serviceProvider =>
{
    var httpClientFactory = serviceProvider.GetRequiredService<IHttpClientFactory>();
    var httpClient = httpClientFactory.CreateClient();
    var quizSettings = builder.Configuration.GetSection("QuizApi").Get<QuizApiSettings>() ?? new QuizApiSettings();
    var logger = serviceProvider.GetRequiredService<ILogger<QuizApiService>>();
    return new QuizApiService(httpClient, quizSettings, logger);
});

builder.Services.AddSingleton<IQuizSessionStore, QuizSessionStore>();
builder.Services.AddSingleton<IQuizSessionService, QuizSessionService>();

// Add PDF to Markdown service as Singleton
builder.Services.AddSingleton<IPdfToMarkdownService, PdfToMarkdownService>();

// Add Semantic Kernel as Singleton
builder.Services.AddSingleton<Kernel>(serviceProvider =>
{
    var azureOpenAISettings = builder.Configuration.GetSection("AzureOpenAI").Get<AzureOpenAISettings>();
    
    var kernelBuilder = Kernel.CreateBuilder();
    
    if (!string.IsNullOrEmpty(azureOpenAISettings?.Endpoint) && 
        !string.IsNullOrEmpty(azureOpenAISettings?.ApiKey) && 
        !string.IsNullOrEmpty(azureOpenAISettings?.DeploymentName))
    {
        try
        {
            // Create HttpClient with SSL certificate validation handling for development
            var httpClientFactory = serviceProvider.GetRequiredService<IHttpClientFactory>();
            var httpClient = httpClientFactory.CreateClient();
            
            // In development, handle SSL certificate validation issues
            if (builder.Environment.IsDevelopment())
            {
                // Configure HttpClient to handle SSL certificate validation issues
                var handler = new HttpClientHandler();
                handler.ServerCertificateCustomValidationCallback = (message, cert, chain, errors) =>
                {
                    Log.Warning("SSL Certificate validation issue encountered: {Errors}", errors);
                    // In development, allow certificates with revocation issues
                    return errors == System.Net.Security.SslPolicyErrors.None || 
                           errors == System.Net.Security.SslPolicyErrors.RemoteCertificateChainErrors;
                };
                httpClient = new HttpClient(handler);
            }
            
            kernelBuilder.AddAzureOpenAIChatCompletion(
                deploymentName: azureOpenAISettings.DeploymentName,
                endpoint: azureOpenAISettings.Endpoint,
                apiKey: azureOpenAISettings.ApiKey,
                httpClient: httpClient);
                
            Log.Information("Azure OpenAI configured successfully with endpoint: {Endpoint}", azureOpenAISettings.Endpoint);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to configure Azure OpenAI. Falling back to mock service.");
            Log.Warning("Azure OpenAI configuration failed. Using mock responses for demo.");
        }
    }
    else
    {
        // Fallback for demo purposes - in production, you should always use proper configuration
        Log.Warning("Azure OpenAI configuration not found. Using mock responses for demo.");
    }
    
    var kernel = kernelBuilder.Build();
    
    // Add Quiz Plugin using singleton services
    try
    {
        Log.Information("Starting QuizPlugin registration for singleton Kernel");
        
        // Get singleton services from container
        var logger = serviceProvider.GetRequiredService<ILogger<QuizPlugin>>();
        var quizSessionService = serviceProvider.GetRequiredService<IQuizSessionService>();
        
        var quizPlugin = new QuizPlugin(quizSessionService, logger);
        
        // Add the plugin and verify it was added
        var addedPlugin = kernel.Plugins.AddFromObject(quizPlugin, "QuizPlugin");
        
        Log.Information("QuizPlugin registered successfully with {FunctionCount} functions", addedPlugin.Count());
        foreach (var function in addedPlugin)
        {
            Log.Information("Registered function: {FunctionName}", function.Name);
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to register QuizPlugin");
    }
    
    // Add PDF to Markdown Plugin using singleton services
    try
    {
        Log.Information("Starting PdfToMarkdownPlugin registration for singleton Kernel");
        
        // Get singleton services from container
        var pdfLogger = serviceProvider.GetRequiredService<ILogger<PdfToMarkdownPlugin>>();
        var pdfService = serviceProvider.GetRequiredService<IPdfToMarkdownService>();
        
        var pdfPlugin = new PdfToMarkdownPlugin(pdfService, pdfLogger);
        
        // Add the plugin and verify it was added
        var addedPdfPlugin = kernel.Plugins.AddFromObject(pdfPlugin, "PdfToMarkdownPlugin");
        
        Log.Information("PdfToMarkdownPlugin registered successfully with {FunctionCount} functions", addedPdfPlugin.Count());
        foreach (var function in addedPdfPlugin)
        {
            Log.Information("Registered PDF function: {FunctionName}", function.Name);
        }
        
        // Also log all plugins and their functions for debugging
        Log.Information("Total plugins in kernel: {PluginCount}", kernel.Plugins.Count);
        foreach (var plugin in kernel.Plugins)
        {
            Log.Information("Plugin '{PluginName}' has {FunctionCount} functions:", plugin.Name, plugin.Count());
            foreach (var func in plugin)
            {
                Log.Information("  Function: {FunctionName}", func.Name);
            }
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to register PdfToMarkdownPlugin");
    }
    
    return kernel;
});

// Add chat completion service as Singleton
builder.Services.AddSingleton<Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService>(serviceProvider =>
{
    var azureOpenAISettings = builder.Configuration.GetSection("AzureOpenAI").Get<AzureOpenAISettings>();
    
    if (!string.IsNullOrEmpty(azureOpenAISettings?.Endpoint) && 
        !string.IsNullOrEmpty(azureOpenAISettings?.ApiKey) && 
        !string.IsNullOrEmpty(azureOpenAISettings?.DeploymentName) &&
        azureOpenAISettings.Endpoint != "https://your-azure-openai-endpoint.openai.azure.com/" &&
        azureOpenAISettings.ApiKey != "your-azure-openai-api-key")
    {
        try
        {
            var kernelService = serviceProvider.GetRequiredService<Kernel>();
            var chatService = kernelService.GetRequiredService<Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService>();
            Log.Information("Using real Azure OpenAI chat completion service");
            return chatService;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to get Azure OpenAI chat completion service. Falling back to mock service.");
            // Fall through to mock service
        }
    }
    
    // Use mock service for demo or when Azure OpenAI fails
    var logger = serviceProvider.GetRequiredService<ILogger<ChatbotApi.Services.MockChatCompletionService>>();
    var kernelInstance = serviceProvider.GetRequiredService<Kernel>();
    Log.Information("Using mock chat completion service");
    return new ChatbotApi.Services.MockChatCompletionService(logger, kernelInstance);
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Disable HTTPS redirection for development to avoid SignalR negotiation issues in some browsers
// app.UseHttpsRedirection();

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

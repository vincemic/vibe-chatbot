using Microsoft.SemanticKernel;
using ChatbotApi.Services;
using ChatbotApi.Models;
using System.ComponentModel;
using System.Text.Json;

namespace ChatbotApi.Plugins
{
    public class QuizPlugin
    {
        private readonly IQuizSessionService _quizSessionService;
        private readonly ILogger<QuizPlugin> _logger;

        public QuizPlugin(IQuizSessionService quizSessionService, ILogger<QuizPlugin> logger)
        {
            _quizSessionService = quizSessionService;
            _logger = logger;
        }

        [KernelFunction("StartQuizAsync")]
        [Description("Start a new quiz game for the user with optional category and difficulty")]
        public async Task<string> StartQuizAsync(
            [Description("The user ID to start the quiz for")] string userId,
            [Description("Quiz category (e.g., 'JavaScript', 'HTML', 'CSS', 'Python', 'SQL'). Leave empty for random category.")] string? category = null,
            [Description("Quiz difficulty level: 'Easy', 'Medium', or 'Hard'. Leave empty for mixed difficulty.")] string? difficulty = null,
            [Description("Number of questions (1-20, default is 5)")] int questionCount = 5)
        {
            try
            {
                _logger.LogInformation("Starting quiz for user: {UserId}, Category: {Category}, Difficulty: {Difficulty}", 
                    userId, category ?? "Any", difficulty ?? "Mixed");

                var request = new QuizStartRequest
                {
                    Category = category,
                    Difficulty = difficulty,
                    Limit = Math.Min(Math.Max(questionCount, 1), 20) // Ensure between 1-20
                };

                var session = await _quizSessionService.StartQuizAsync(userId, request);
                var firstQuestion = await _quizSessionService.GetCurrentQuestionAsync(userId);

                if (firstQuestion == null)
                {
                    return "Sorry, I couldn't start the quiz. No questions are available right now.";
                }

                var categoryText = !string.IsNullOrEmpty(session.Category) ? $" in {session.Category}" : "";
                var difficultyText = !string.IsNullOrEmpty(session.Difficulty) ? $" ({session.Difficulty} level)" : "";

                var response = new
                {
                    type = "quiz_started",
                    category = session.Category,
                    difficulty = session.Difficulty,
                    totalQuestions = session.TotalQuestions,
                    score = 0,
                    currentQuestion = new
                    {
                        number = 1,
                        total = session.TotalQuestions,
                        question = firstQuestion.Question,
                        answers = firstQuestion.Answers
                    }
                };

                return System.Text.Json.JsonSerializer.Serialize(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting quiz for user: {UserId}", userId);
                return "Sorry, I encountered an error while starting the quiz. Please try again later.";
            }
        }

        [KernelFunction("SubmitAnswerAsync")]
        [Description("Submit an answer for the current quiz question")]
        public async Task<string> SubmitAnswerAsync(
            [Description("The user ID submitting the answer")] string userId,
            [Description("The selected answer (A, B, C, or D)")] string answer)
        {
            try
            {
                var session = await _quizSessionService.GetActiveSessionAsync(userId);
                if (session == null)
                {
                    return "❌ No active quiz found. Start a new quiz by typing 'start quiz'!";
                }

                var currentQuestion = await _quizSessionService.GetCurrentQuestionAsync(userId);
                if (currentQuestion == null)
                {
                    return "❌ No current question found. The quiz might have ended.";
                }

                // Convert letter answer to answer key
                var answerKey = ConvertLetterToAnswerKey(answer.Trim().ToUpper());
                if (string.IsNullOrEmpty(answerKey))
                {
                    return "❌ Please provide a valid answer (A, B, C, or D).";
                }

                // Submit the answer
                var submitted = await _quizSessionService.SubmitAnswerAsync(userId, answerKey);
                if (!submitted)
                {
                    return "❌ Error submitting your answer. Please try again.";
                }

                // Check if answer was correct
                var userAnswer = session.UserAnswers.LastOrDefault();
                var isCorrect = userAnswer?.IsCorrect ?? false;
                
                // Add explanation if available
                var explanation = !string.IsNullOrEmpty(currentQuestion.Explanation) ? currentQuestion.Explanation : null;

                // Get next question or complete quiz
                var nextQuestion = await _quizSessionService.GetNextQuestionAsync(userId);
                
                if (nextQuestion == null)
                {
                    // Quiz completed
                    var quizResult = await _quizSessionService.CompleteQuizAsync(userId);
                    if (quizResult != null)
                    {
                        var completionResponse = new
                        {
                            type = "quiz_completed",
                            isCorrect = isCorrect,
                            explanation = explanation,
                            finalResult = new
                            {
                                finalScore = quizResult.FinalScore,
                                totalQuestions = quizResult.TotalQuestions,
                                percentage = quizResult.Percentage,
                                grade = quizResult.Grade,
                                duration = new
                                {
                                    minutes = quizResult.Duration.Minutes,
                                    seconds = quizResult.Duration.Seconds
                                }
                            }
                        };
                        return System.Text.Json.JsonSerializer.Serialize(completionResponse);
                    }
                    
                    var fallbackResponse = new
                    {
                        type = "quiz_completed",
                        isCorrect = isCorrect,
                        explanation = explanation
                    };
                    return System.Text.Json.JsonSerializer.Serialize(fallbackResponse);
                }
                else
                {
                    // Continue with next question
                    var updatedSession = await _quizSessionService.GetActiveSessionAsync(userId);
                    var questionNumber = (updatedSession?.CurrentQuestionIndex ?? 0) + 1;
                    
                    var continueResponse = new
                    {
                        type = "quiz_continue",
                        isCorrect = isCorrect,
                        explanation = explanation,
                        score = updatedSession?.Score ?? 0,
                        totalQuestions = updatedSession?.TotalQuestions ?? 0,
                        currentQuestion = new
                        {
                            number = questionNumber,
                            total = updatedSession?.TotalQuestions ?? 0,
                            question = nextQuestion.Question,
                            answers = nextQuestion.Answers
                        }
                    };
                    return System.Text.Json.JsonSerializer.Serialize(continueResponse);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting answer for user: {UserId}", userId);
                return "Sorry, I encountered an error while processing your answer. Please try again.";
            }
        }

        [KernelFunction("GetQuizStatusAsync")]
        [Description("Get the current quiz status and question for the user")]
        public async Task<string> GetQuizStatusAsync([Description("The user ID to check quiz status for")] string userId)
        {
            try
            {
                var session = await _quizSessionService.GetActiveSessionAsync(userId);
                if (session == null)
                {
                    return "📝 No active quiz. Start a new quiz by saying 'start quiz' or 'quiz me'!";
                }

                var currentQuestion = await _quizSessionService.GetCurrentQuestionAsync(userId);
                if (currentQuestion == null)
                {
                    return "🎉 Quiz completed! Start a new quiz anytime!";
                }

                var questionNumber = session.CurrentQuestionIndex + 1;
                var categoryText = !string.IsNullOrEmpty(session.Category) ? $" ({session.Category})" : "";

                var statusResponse = new
                {
                    type = "quiz_status",
                    category = session.Category,
                    score = session.Score,
                    totalQuestions = session.TotalQuestions,
                    currentQuestion = new
                    {
                        number = questionNumber,
                        total = session.TotalQuestions,
                        question = currentQuestion.Question,
                        answers = currentQuestion.Answers
                    }
                };

                return System.Text.Json.JsonSerializer.Serialize(statusResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting quiz status for user: {UserId}", userId);
                return "Sorry, I encountered an error while checking your quiz status.";
            }
        }

        [KernelFunction("EndQuizAsync")]
        [Description("End the current quiz session for the user")]
        public async Task<string> EndQuizAsync([Description("The user ID to end the quiz for")] string userId)
        {
            try
            {
                var session = await _quizSessionService.GetActiveSessionAsync(userId);
                if (session == null)
                {
                    return "📝 No active quiz to end.";
                }

                var ended = await _quizSessionService.EndQuizAsync(userId);
                if (ended)
                {
                    return $"🛑 Quiz ended. Final score: {session.Score}/{session.TotalQuestions}\n" +
                           "Start a new quiz anytime by saying 'start quiz'!";
                }

                return "❌ Error ending the quiz. Please try again.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ending quiz for user: {UserId}", userId);
                return "Sorry, I encountered an error while ending the quiz.";
            }
        }

        [KernelFunction("GetAvailableCategoriesAsync")]
        [Description("Get available quiz categories")]
        public async Task<string> GetAvailableCategoriesAsync()
        {
            try
            {
                var categories = await _quizSessionService.GetAvailableCategoriesAsync();
                
                if (categories == null || !categories.Any())
                {
                    return "📚 **Available Categories:** General Knowledge, Programming, Web Development";
                }

                var categoryList = string.Join(", ", categories.Keys.Take(10)); // Show up to 10 categories
                return $"📚 **Available Quiz Categories:**\n{categoryList}\n\n" +
                       "💡 Start a quiz by saying 'start quiz [category]' (e.g., 'start quiz JavaScript')";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available categories");
                return "📚 **Available Categories:** JavaScript, HTML, CSS, Python, SQL, Linux, DevOps, Programming";
            }
        }

        private string ConvertLetterToAnswerKey(string letter)
        {
            return letter switch
            {
                "A" => "answer_a",
                "B" => "answer_b",
                "C" => "answer_c",
                "D" => "answer_d",
                _ => string.Empty
            };
        }
    }
}

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
            [Description("Quiz category (e.g., 'JavaScript', 'HTML', 'CSS', 'Python', 'SQL'). Leave empty to show available categories first.")] string? category = null,
            [Description("Quiz difficulty level: 'Easy', 'Medium', or 'Hard'. Leave empty for mixed difficulty.")] string? difficulty = null,
            [Description("Number of questions (1-20, default is 5)")] int questionCount = 5)
        {
            try
            {
                // If no category is provided, show available categories first
                if (string.IsNullOrEmpty(category))
                {
                    return await GetAvailableCategoriesAsync();
                }

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
        [Description("Submit an answer for the current quiz question. Call this function when the user provides a single letter (A, B, C, or D) as their response, as this indicates they are answering a quiz question.")]
        public async Task<string> SubmitAnswerAsync(
            [Description("The user ID submitting the answer")] string userId,
            [Description("The selected answer - single letter: A, B, C, or D (case insensitive)")] string answer)
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
                
                // Get the correct answer information
                var correctAnswerInfo = GetCorrectAnswerInfo(currentQuestion);
                
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
                            correctAnswer = !isCorrect ? correctAnswerInfo : null,
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
                        explanation = explanation,
                        correctAnswer = !isCorrect ? correctAnswerInfo : null
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
                        correctAnswer = !isCorrect ? correctAnswerInfo : null,
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

        [KernelFunction("StartQuizWithCategoryAsync")]
        [Description("Start a quiz with a specific category selected by the user")]
        public async Task<string> StartQuizWithCategoryAsync(
            [Description("The user ID to start the quiz for")] string userId,
            [Description("The selected quiz category")] string category,
            [Description("Quiz difficulty level: 'Easy', 'Medium', or 'Hard'. Leave empty for mixed difficulty.")] string? difficulty = null,
            [Description("Number of questions (1-20, default is 5)")] int questionCount = 5)
        {
            try
            {
                _logger.LogInformation("Starting quiz for user: {UserId}, Category: {Category}, Difficulty: {Difficulty}", 
                    userId, category, difficulty ?? "Mixed");

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
                    return "Sorry, I couldn't start the quiz. No questions are available for that category right now.";
                }

                var categoryText = !string.IsNullOrEmpty(session.Category) ? $" in {session.Category}" : "";
                var difficultyText = !string.IsNullOrEmpty(session.Difficulty) ? $" ({session.Difficulty} level)" : "";

                // Format the answers from the dictionary
                var answerA = firstQuestion.Answers.TryGetValue("answer_a", out var a) ? a : "Option A";
                var answerB = firstQuestion.Answers.TryGetValue("answer_b", out var b) ? b : "Option B";
                var answerC = firstQuestion.Answers.TryGetValue("answer_c", out var c) ? c : "Option C";
                var answerD = firstQuestion.Answers.TryGetValue("answer_d", out var d) ? d : "Option D";

                return $"🎯 **Quiz Started{categoryText}{difficultyText}!**\n\n" +
                       $"**Question {session.CurrentQuestionIndex + 1} of {session.TotalQuestions}:**\n" +
                       $"{firstQuestion.Question}\n\n" +
                       $"**A)** {answerA}\n" +
                       $"**B)** {answerB}\n" +
                       $"**C)** {answerC}\n" +
                       $"**D)** {answerD}\n\n" +
                       "Type A, B, C, or D to answer!";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting quiz with category {Category}: {Error}", category, ex.Message);
                return $"Sorry, I couldn't start a quiz for '{category}'. Try saying 'quiz categories' to see available options.";
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

        private object? GetCorrectAnswerInfo(QuizQuestion question)
        {
            try
            {
                // Find which answer is correct
                string? correctKey = null;
                string? correctText = null;
                
                // Check CorrectAnswers dictionary first
                if (question.CorrectAnswers != null)
                {
                    foreach (var kvp in question.CorrectAnswers)
                    {
                        if (kvp.Value.Equals("true", StringComparison.OrdinalIgnoreCase))
                        {
                            correctKey = kvp.Key.Replace("_correct", ""); // Remove "_correct" suffix
                            break;
                        }
                    }
                }
                
                // Get the correct answer text
                if (!string.IsNullOrEmpty(correctKey) && question.Answers.TryGetValue(correctKey, out var answerText))
                {
                    correctText = answerText;
                }
                
                // Convert answer key to letter (answer_a -> A)
                var correctLetter = correctKey switch
                {
                    "answer_a" => "A",
                    "answer_b" => "B", 
                    "answer_c" => "C",
                    "answer_d" => "D",
                    _ => null
                };
                
                if (!string.IsNullOrEmpty(correctLetter) && !string.IsNullOrEmpty(correctText))
                {
                    return new
                    {
                        letter = correctLetter,
                        text = correctText
                    };
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting correct answer info for question {QuestionId}", question.Id);
                return null;
            }
        }
    }
}

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

                return $"🎯 **Quiz Started!** {categoryText}{difficultyText}\n\n" +
                       $"📊 **Questions:** {session.TotalQuestions} | **Score:** 0/{session.TotalQuestions}\n\n" +
                       $"**Question 1/{session.TotalQuestions}:**\n" +
                       $"{firstQuestion.Question}\n\n" +
                       FormatAnswerOptions(firstQuestion) + "\n\n" +
                       "💡 Type your answer (A, B, C, or D) to continue!";
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

                var result = isCorrect ? "✅ **Correct!**" : "❌ **Incorrect**";
                
                // Add explanation if available
                if (!string.IsNullOrEmpty(currentQuestion.Explanation))
                {
                    result += $"\n💡 {currentQuestion.Explanation}";
                }

                // Get next question or complete quiz
                var nextQuestion = await _quizSessionService.GetNextQuestionAsync(userId);
                
                if (nextQuestion == null)
                {
                    // Quiz completed
                    var quizResult = await _quizSessionService.CompleteQuizAsync(userId);
                    if (quizResult != null)
                    {
                        return result + "\n\n" + FormatQuizCompletion(quizResult);
                    }
                    return result + "\n\n🎉 Quiz completed! Great job!";
                }
                else
                {
                    // Continue with next question
                    var updatedSession = await _quizSessionService.GetActiveSessionAsync(userId);
                    var questionNumber = (updatedSession?.CurrentQuestionIndex ?? 0) + 1;
                    
                    return result + "\n\n" +
                           $"📊 **Score:** {updatedSession?.Score ?? 0}/{updatedSession?.TotalQuestions ?? 0}\n\n" +
                           $"**Question {questionNumber}/{updatedSession?.TotalQuestions ?? 0}:**\n" +
                           $"{nextQuestion.Question}\n\n" +
                           FormatAnswerOptions(nextQuestion) + "\n\n" +
                           "💡 Type your answer (A, B, C, or D) to continue!";
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

                return $"🎯 **Active Quiz{categoryText}**\n\n" +
                       $"📊 **Score:** {session.Score}/{session.TotalQuestions} | **Progress:** {questionNumber}/{session.TotalQuestions}\n\n" +
                       $"**Question {questionNumber}:**\n" +
                       $"{currentQuestion.Question}\n\n" +
                       FormatAnswerOptions(currentQuestion) + "\n\n" +
                       "💡 Type your answer (A, B, C, or D) to continue!";
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

        private string FormatAnswerOptions(QuizQuestion question)
        {
            var options = new List<string>();
            var letters = new[] { "A", "B", "C", "D" };
            var answerKeys = new[] { "answer_a", "answer_b", "answer_c", "answer_d" };

            for (int i = 0; i < answerKeys.Length && i < letters.Length; i++)
            {
                if (question.Answers.TryGetValue(answerKeys[i], out var answerText) && !string.IsNullOrEmpty(answerText))
                {
                    options.Add($"**{letters[i]}.** {answerText}");
                }
            }

            return string.Join("\n", options);
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

        private string FormatQuizCompletion(QuizResult result)
        {
            var emoji = result.Percentage switch
            {
                >= 90 => "🏆",
                >= 80 => "🥇",
                >= 70 => "🥈",
                >= 60 => "🥉",
                _ => "📚"
            };

            var encouragement = result.Percentage switch
            {
                >= 90 => "Outstanding! You're a quiz master! 🌟",
                >= 80 => "Excellent work! Great knowledge! 👏",
                >= 70 => "Good job! You did well! 👍",
                >= 60 => "Not bad! Keep learning! 📖",
                _ => "Keep practicing! You'll get better! 💪"
            };

            return $"{emoji} **Quiz Complete!**\n\n" +
                   $"📊 **Final Score:** {result.FinalScore}/{result.TotalQuestions} ({result.Percentage:F1}%)\n" +
                   $"🎯 **Grade:** {result.Grade}\n" +
                   $"⏱️ **Time:** {result.Duration.Minutes}m {result.Duration.Seconds}s\n\n" +
                   $"{encouragement}\n\n" +
                   "🚀 Ready for another challenge? Say 'start quiz' to play again!";
        }
    }
}

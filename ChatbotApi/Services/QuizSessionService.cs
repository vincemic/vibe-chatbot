using ChatbotApi.Models;

namespace ChatbotApi.Services
{
    public interface IQuizSessionService
    {
        Task<QuizSession> StartQuizAsync(string userId, QuizStartRequest request);
        Task<QuizSession?> GetActiveSessionAsync(string userId);
        Task<bool> SubmitAnswerAsync(string userId, string selectedAnswer);
        Task<QuizResult?> CompleteQuizAsync(string userId);
        Task<QuizQuestion?> GetCurrentQuestionAsync(string userId);
        Task<QuizQuestion?> GetNextQuestionAsync(string userId);
        Task<bool> EndQuizAsync(string userId);
        Task<Dictionary<string, object>> GetAvailableCategoriesAsync();
    }

    public class QuizSessionService : IQuizSessionService
    {
        private readonly IQuizApiService _quizApiService;
        private readonly IQuizSessionStore _sessionStore;
        private readonly ILogger<QuizSessionService> _logger;

        public QuizSessionService(IQuizApiService quizApiService, IQuizSessionStore sessionStore, ILogger<QuizSessionService> logger)
        {
            _quizApiService = quizApiService;
            _sessionStore = sessionStore;
            _logger = logger;
        }

        public async Task<QuizSession> StartQuizAsync(string userId, QuizStartRequest request)
        {
            try
            {
                // End any existing session for this user
                await EndQuizAsync(userId);

                _logger.LogInformation("Starting new quiz session for user: {UserId}", userId);

                // Fetch questions from the API
                var questions = await _quizApiService.GetQuestionsAsync(request);

                if (questions == null || !questions.Any())
                {
                    throw new InvalidOperationException("No questions available for the specified criteria");
                }

                var session = new QuizSession
                {
                    UserId = userId,
                    Questions = questions,
                    TotalQuestions = questions.Count,
                    Category = request.Category,
                    Difficulty = request.Difficulty,
                    StartTime = DateTime.UtcNow
                };

                _sessionStore.SetSession(userId, session);

                _logger.LogInformation("Quiz session started successfully for user: {UserId}, Questions: {QuestionCount}", 
                    userId, questions.Count);

                return session;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting quiz session for user: {UserId}", userId);
                throw;
            }
        }

        public async Task<QuizSession?> GetActiveSessionAsync(string userId)
        {
            return await Task.FromResult(_sessionStore.GetSession(userId));
        }

        public async Task<bool> SubmitAnswerAsync(string userId, string selectedAnswer)
        {
            try
            {
                var session = await GetActiveSessionAsync(userId);
                if (session == null || session.IsCompleted)
                {
                    _logger.LogWarning("No active session found for user: {UserId}", userId);
                    return false;
                }

                var currentQuestion = session.Questions[session.CurrentQuestionIndex];
                
                _logger.LogInformation("Evaluating answer for user: {UserId}, Question: {QuestionId}, Selected: {SelectedAnswer}", 
                    userId, currentQuestion.Id, selectedAnswer);
                
                // Determine if answer is correct
                bool isCorrect = IsAnswerCorrect(currentQuestion, selectedAnswer);
                
                if (isCorrect)
                {
                    session.Score++;
                    _logger.LogInformation("Correct answer! Score increased to {Score}", session.Score);
                }
                else
                {
                    _logger.LogInformation("Incorrect answer. Score remains {Score}", session.Score);
                }

                // Record the answer
                session.UserAnswers.Add(new QuizAnswer
                {
                    QuestionId = currentQuestion.Id,
                    SelectedAnswer = selectedAnswer,
                    IsCorrect = isCorrect,
                    AnsweredAt = DateTime.UtcNow
                });

                _logger.LogInformation("Answer submitted for user: {UserId}, Question: {QuestionId}, Correct: {IsCorrect}", 
                    userId, currentQuestion.Id, isCorrect);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting answer for user: {UserId}", userId);
                return false;
            }
        }

        public async Task<QuizQuestion?> GetCurrentQuestionAsync(string userId)
        {
            var session = await GetActiveSessionAsync(userId);
            if (session == null || session.IsCompleted || session.CurrentQuestionIndex >= session.Questions.Count)
            {
                return null;
            }

            return session.Questions[session.CurrentQuestionIndex];
        }

        public async Task<QuizQuestion?> GetNextQuestionAsync(string userId)
        {
            var session = await GetActiveSessionAsync(userId);
            if (session == null || session.IsCompleted)
            {
                return null;
            }

            session.CurrentQuestionIndex++;

            if (session.CurrentQuestionIndex >= session.Questions.Count)
            {
                // Quiz completed
                session.IsCompleted = true;
                session.EndTime = DateTime.UtcNow;
                return null;
            }

            return session.Questions[session.CurrentQuestionIndex];
        }

        public async Task<QuizResult?> CompleteQuizAsync(string userId)
        {
            try
            {
                var session = await GetActiveSessionAsync(userId);
                if (session == null)
                {
                    return null;
                }

                session.IsCompleted = true;
                session.EndTime = DateTime.UtcNow;

                var result = new QuizResult
                {
                    SessionId = session.SessionId,
                    FinalScore = session.Score,
                    TotalQuestions = session.TotalQuestions,
                    Percentage = session.TotalQuestions > 0 ? (double)session.Score / session.TotalQuestions * 100 : 0,
                    Duration = session.EndTime.Value - session.StartTime,
                    Answers = session.UserAnswers,
                    Grade = CalculateGrade(session.Score, session.TotalQuestions)
                };

                _logger.LogInformation("Quiz completed for user: {UserId}, Score: {Score}/{Total} ({Percentage:F1}%)", 
                    userId, session.Score, session.TotalQuestions, result.Percentage);

                // Remove session after completion
                _sessionStore.RemoveSession(userId);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing quiz for user: {UserId}", userId);
                return null;
            }
        }

        public async Task<bool> EndQuizAsync(string userId)
        {
            var removed = _sessionStore.RemoveSession(userId);
            _logger.LogInformation("Quiz session ended for user: {UserId}, Was Active: {WasActive}", userId, removed);
            return await Task.FromResult(removed);
        }

        public async Task<Dictionary<string, object>> GetAvailableCategoriesAsync()
        {
            return await _quizApiService.GetCategoriesAsync();
        }

        private bool IsAnswerCorrect(QuizQuestion question, string selectedAnswer)
        {
            try
            {
                // Check correct_answers dictionary first (from QuizAPI)
                if (question.CorrectAnswers != null && question.CorrectAnswers.Count > 0)
                {
                    var correctKey = $"{selectedAnswer}_correct";
                    if (question.CorrectAnswers.TryGetValue(correctKey, out var correctValue))
                    {
                        var isCorrect = correctValue.Equals("true", StringComparison.OrdinalIgnoreCase);
                        _logger.LogDebug("Answer check for {SelectedAnswer}: {CorrectKey} = {CorrectValue}, IsCorrect: {IsCorrect}", 
                            selectedAnswer, correctKey, correctValue, isCorrect);
                        return isCorrect;
                    }
                }

                // Fallback for direct answer matching
                if (!string.IsNullOrEmpty(question.CorrectAnswer))
                {
                    var isCorrect = selectedAnswer.Equals(question.CorrectAnswer, StringComparison.OrdinalIgnoreCase);
                    _logger.LogDebug("Direct answer check: {SelectedAnswer} vs {CorrectAnswer}, IsCorrect: {IsCorrect}", 
                        selectedAnswer, question.CorrectAnswer, isCorrect);
                    return isCorrect;
                }

                // Log available correct answers for debugging
                var availableKeys = question.CorrectAnswers?.Keys.ToArray() ?? Array.Empty<string>();
                _logger.LogWarning("Could not determine correct answer for question {QuestionId}. Available correct_answers: {CorrectAnswers}", 
                    question.Id, string.Join(", ", availableKeys));

                // Default fallback - assume answer_a is correct for demo purposes
                var defaultCorrect = selectedAnswer.Equals("answer_a", StringComparison.OrdinalIgnoreCase);
                _logger.LogDebug("Using default fallback: {SelectedAnswer} vs answer_a, IsCorrect: {IsCorrect}", 
                    selectedAnswer, defaultCorrect);
                return defaultCorrect;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking answer correctness for question {QuestionId}", question.Id);
                return false;
            }
        }

        private string CalculateGrade(int score, int total)
        {
            if (total == 0) return "N/A";

            var percentage = (double)score / total * 100;

            return percentage switch
            {
                >= 90 => "A+",
                >= 80 => "A",
                >= 70 => "B",
                >= 60 => "C",
                >= 50 => "D",
                _ => "F"
            };
        }
    }
}

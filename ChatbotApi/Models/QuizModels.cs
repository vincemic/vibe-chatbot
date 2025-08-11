using System.Text.Json.Serialization;

namespace ChatbotApi.Models
{
    public class QuizApiSettings
    {
        public string? ApiKey { get; set; }
        public string BaseUrl { get; set; } = "https://quizapi.io/api/v1";
    }

    public class QuizQuestion
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("question")]
        public string Question { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("answers")]
        public Dictionary<string, string?> Answers { get; set; } = new();

        [JsonPropertyName("multiple_correct_answers")]
        public string MultipleCorrectAnswers { get; set; } = "false";

        [JsonPropertyName("correct_answers")]
        public Dictionary<string, string> CorrectAnswers { get; set; } = new();

        [JsonPropertyName("correct_answer")]
        public string? CorrectAnswer { get; set; }

        [JsonPropertyName("explanation")]
        public string? Explanation { get; set; }

        [JsonPropertyName("tip")]
        public string? Tip { get; set; }

        [JsonPropertyName("tags")]
        public List<QuizTag>? Tags { get; set; }

        [JsonPropertyName("category")]
        public string? Category { get; set; }

        [JsonPropertyName("difficulty")]
        public string? Difficulty { get; set; }
    }

    public class QuizTag
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class QuizSession
    {
        public string SessionId { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public List<QuizQuestion> Questions { get; set; } = new();
        public int CurrentQuestionIndex { get; set; } = 0;
        public int Score { get; set; } = 0;
        public int TotalQuestions { get; set; } = 0;
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        public List<QuizAnswer> UserAnswers { get; set; } = new();
        public string? Category { get; set; }
        public string? Difficulty { get; set; }
        public bool IsCompleted { get; set; } = false;
    }

    public class QuizAnswer
    {
        public int QuestionId { get; set; }
        public string SelectedAnswer { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;
    }

    public class QuizResult
    {
        public string SessionId { get; set; } = string.Empty;
        public int FinalScore { get; set; }
        public int TotalQuestions { get; set; }
        public double Percentage { get; set; }
        public TimeSpan Duration { get; set; }
        public string Grade { get; set; } = string.Empty;
        public List<QuizAnswer> Answers { get; set; } = new();
    }

    public class QuizStartRequest
    {
        public string? Category { get; set; }
        public string? Difficulty { get; set; }
        public int Limit { get; set; } = 5;
        public string? Tags { get; set; }
    }
}

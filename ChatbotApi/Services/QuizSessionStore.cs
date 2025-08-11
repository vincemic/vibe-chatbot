using ChatbotApi.Models;
using System.Collections.Concurrent;

namespace ChatbotApi.Services
{
    public interface IQuizSessionStore
    {
        QuizSession? GetSession(string userId);
        void SetSession(string userId, QuizSession session);
        bool RemoveSession(string userId);
        void UpdateSession(string userId, Action<QuizSession> updateAction);
    }

    public class QuizSessionStore : IQuizSessionStore
    {
        private readonly ConcurrentDictionary<string, QuizSession> _sessions = new();

        public QuizSession? GetSession(string userId)
        {
            return _sessions.TryGetValue(userId, out var session) ? session : null;
        }

        public void SetSession(string userId, QuizSession session)
        {
            _sessions[userId] = session;
        }

        public bool RemoveSession(string userId)
        {
            return _sessions.TryRemove(userId, out _);
        }

        public void UpdateSession(string userId, Action<QuizSession> updateAction)
        {
            if (_sessions.TryGetValue(userId, out var session))
            {
                updateAction(session);
                _sessions[userId] = session; // Ensure it's updated
            }
        }
    }
}

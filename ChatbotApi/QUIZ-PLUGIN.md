# 🎯 Quiz Plugin for Chatbot

This Semantic Kernel plugin adds interactive quiz functionality to the chatbot, allowing users to test their knowledge on various topics using the QuizAPI.io service.

## ✨ Features

### 🎮 Quiz Games
- **Interactive Quizzes**: Start quiz games with customizable topics and difficulty
- **Multiple Categories**: JavaScript, HTML, CSS, Python, SQL, Linux, DevOps, and more
- **Difficulty Levels**: Easy, Medium, and Hard questions
- **Score Tracking**: Real-time score updates and final results with grades
- **Session Management**: Persistent quiz sessions with automatic cleanup

### 🎯 Smart AI Integration
- **Natural Language**: Start quizzes with phrases like "quiz me" or "start quiz JavaScript"
- **Context Awareness**: AI understands quiz commands and provides helpful guidance
- **Answer Recognition**: Simple A, B, C, D answer format
- **Progress Tracking**: See your progress through the quiz

### 🔧 Fallback System
- **Offline Mode**: Works without QuizAPI.io using built-in fallback questions
- **Demo Questions**: Programming and web development questions for testing
- **Graceful Degradation**: Seamless experience even without API access

## 🚀 Getting Started

### 1. QuizAPI.io Setup (Optional)

Get a free API key from [QuizAPI.io](https://quizapi.io/):

```bash
# Add to user secrets
dotnet user-secrets set "QuizApi:ApiKey" "your-actual-api-key"
```

### 2. Available Commands

#### Starting Quizzes
- `"start quiz"` - Random quiz with 5 questions
- `"quiz me"` - Quick random quiz
- `"start quiz JavaScript"` - JavaScript-specific quiz
- `"start quiz CSS easy"` - Easy CSS questions
- `"start quiz Python 10"` - 10 Python questions

#### During Quiz
- `"A"`, `"B"`, `"C"`, `"D"` - Answer current question
- `"quiz status"` - Check current progress
- `"end quiz"` - Stop current quiz

#### Information
- `"quiz categories"` - See available topics
- `"help"` - Get command help

## 📚 Available Categories

### Programming Languages
- JavaScript
- Python  
- Java
- HTML
- CSS
- SQL

### Technology Topics
- Linux
- DevOps
- Docker
- Programming (General)
- Code (General)

### Coming Soon
- Node.js
- React
- Angular
- .NET
- Database Design

## 🎮 How to Play

1. **Start a Quiz**: Say "start quiz" or specify a topic like "quiz me on JavaScript"

2. **Answer Questions**: When presented with a question, type A, B, C, or D

3. **Track Progress**: See your score and progress after each answer

4. **View Results**: Get detailed results with grade and performance feedback

5. **Play Again**: Start a new quiz anytime!

## 📊 Example Interaction

```
User: "start quiz JavaScript"

Bot: 🎯 Quiz Started! in JavaScript (Easy level)
     📊 Questions: 5 | Score: 0/5
     
     Question 1/5:
     What does 'typeof null' return in JavaScript?
     
     A. "null"
     B. "object"
     C. "undefined"
     D. "boolean"
     
     💡 Type your answer (A, B, C, or D) to continue!

User: "B"

Bot: ✅ Correct!
     💡 In JavaScript, typeof null returns "object" due to a historical bug.
     
     📊 Score: 1/5
     
     Question 2/5:
     Which method is used to add an element to the end of an array?
     ...
```

## 🔧 Technical Implementation

### Plugin Architecture
- **QuizPlugin**: Main Semantic Kernel plugin with function calling
- **QuizSessionService**: Manages quiz sessions and state
- **QuizApiService**: Handles external API communication
- **MockChatCompletionService**: Enhanced with quiz integration

### Data Models
- **QuizSession**: Tracks user progress and state
- **QuizQuestion**: API response structure
- **QuizResult**: Final score and performance data
- **QuizAnswer**: Individual answer tracking

### Key Features
- **Session Persistence**: Quiz state maintained across interactions
- **Concurrent Users**: Multiple users can have separate quiz sessions
- **Error Handling**: Graceful fallbacks for API failures
- **Logging**: Comprehensive logging for debugging and monitoring

## 🎯 Quiz Scoring System

### Grade Calculation
- **A+**: 90-100% (Outstanding!)
- **A**: 80-89% (Excellent work!)
- **B**: 70-79% (Good job!)
- **C**: 60-69% (Not bad!)
- **D**: 50-59% (Keep practicing!)
- **F**: Below 50% (Study more!)

### Performance Feedback
- Detailed explanations for each question
- Time tracking for quiz completion
- Encouraging messages based on performance
- Suggestions for improvement

## 🛠️ Configuration

### appsettings.json
```json
{
  "QuizApi": {
    "BaseUrl": "https://quizapi.io/api/v1"
  }
}
```

### User Secrets
```json
{
  "QuizApi": {
    "ApiKey": "your-api-key-here"
  }
}
```

## 🎮 Advanced Features

### Custom Quiz Parameters
- **Question Count**: 1-20 questions per quiz
- **Category Filtering**: Specific topic focus
- **Difficulty Selection**: Easy, Medium, Hard
- **Mixed Difficulty**: Random difficulty levels

### Smart AI Responses
- Context-aware conversation flow
- Helpful hints and tips
- Educational explanations
- Motivational feedback

### Session Management
- Automatic cleanup of completed sessions
- Progress saving during active quizzes
- Support for quiz interruption and resumption
- Concurrent multi-user support

## 🚀 Future Enhancements

### Planned Features
- **Leaderboards**: Track high scores
- **Custom Quizzes**: User-created questions
- **Timed Quizzes**: Speed challenges
- **Team Quizzes**: Multiplayer functionality
- **Achievement System**: Badges and rewards
- **Study Mode**: Review incorrect answers

### Additional Integrations
- **More Quiz Sources**: Multiple API providers
- **Educational Content**: Integration with learning platforms
- **Progress Tracking**: Long-term learning analytics
- **Social Features**: Share results and challenges

## 🐛 Troubleshooting

### Common Issues

**Quiz won't start**: Check if QuizAPI.io key is configured or use fallback mode

**API errors**: Fallback questions will be used automatically

**Session lost**: Quiz sessions are in-memory; restart will reset progress

**Wrong answers not explained**: Some fallback questions may have limited explanations

### Support
- Check logs for detailed error information
- Verify user secrets configuration
- Test with fallback questions first
- Ensure network connectivity for API access

---

🎉 **Ready to Quiz?** Try saying "start quiz" in the chatbot and test your knowledge!

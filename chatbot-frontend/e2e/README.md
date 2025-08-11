# Quiz Functionality Tests

This directory contains comprehensive Playwright tests for the quiz functionality of the chatbot application.

## Test Files

### 1. `quiz.spec.ts` - Core Quiz Functionality
Tests the basic quiz operations:
- Starting quizzes with different parameters (category, difficulty)
- Handling quiz answers and score tracking
- Quiz status requests
- Error handling for invalid answers
- Full quiz completion and results
- Quiz state management across interactions

### 2. `quiz-api.spec.ts` - API Integration Tests
Tests the integration with QuizAPI.io:
- Real API question retrieval
- Different categories and difficulty levels
- Fallback to mock questions when API is unavailable
- API response format validation
- Error handling (500, 429, timeouts)
- Security validation (no API key exposure)
- Quiz statistics accuracy with real data

### 3. `quiz-performance.spec.ts` - Performance Tests
Tests performance characteristics:
- Quiz start response times
- Rapid answer handling efficiency
- Concurrent quiz sessions (stress testing)
- Memory usage during quiz sessions
- Long quiz session performance
- API timeout handling

## Configuration

### Quiz-Specific Configuration
- `playwright-quiz.config.ts` - Dedicated configuration for quiz tests only
- Extended timeouts for API interactions
- Specialized reporter settings
- Mobile and desktop browser testing

### Test Scripts
Available in `package.json`:
- `npm run e2e:quiz` - Run all quiz tests
- `npm run e2e:quiz:ui` - Run quiz tests in UI mode
- `npm run e2e:quiz:headed` - Run quiz tests with browser UI
- `npm run e2e:quiz:debug` - Debug quiz tests
- `npm run test:quiz` - Shorthand for quiz tests

### VS Code Tasks
Available in `.vscode/tasks.json`:
- `test-quiz` - Run quiz tests
- `test-quiz-ui` - Run quiz tests in UI mode
- `test-quiz-debug` - Debug quiz tests
- `test-all-with-quiz` - Run all tests including quiz tests

## Test Data Attributes

The tests rely on specific data-testid attributes in the Angular components:
- `[data-testid="chat-container"]` - Main chat container
- `[data-testid="message-input"]` - Message input field
- `[data-testid="send-button"]` - Send message button
- `[data-testid="typing-indicator"]` - Typing indicator element

## Quiz Test Scenarios

### Basic Functionality
1. **Quiz Initiation**: Tests starting quizzes with various commands
2. **Answer Processing**: Tests submitting answers (A, B, C, D)
3. **Status Tracking**: Tests requesting quiz status and progress
4. **Score Calculation**: Tests scoring and grade assignment
5. **Session Management**: Tests multiple quiz sessions and state

### API Integration
1. **Real API Calls**: Tests integration with QuizAPI.io service
2. **Category Filtering**: Tests science, history, geography, literature categories
3. **Difficulty Levels**: Tests easy, medium, hard difficulty settings
4. **Fallback Handling**: Tests mock questions when API is unavailable
5. **Error Scenarios**: Tests 500, 429, timeout responses

### Performance Metrics
1. **Response Times**: Quiz start < 5s, answers < 3s average
2. **Concurrent Users**: Multiple simultaneous quiz sessions
3. **Memory Usage**: < 50MB increase during quiz sessions
4. **Long Sessions**: No performance degradation over time
5. **API Timeouts**: Graceful handling of slow responses

## Running the Tests

### Prerequisites
1. Backend API running on `https://localhost:7271`
2. Frontend application running on `http://localhost:4200`
3. QuizAPI.io configured with valid API key in user secrets
4. Playwright browsers installed (`npx playwright install`)

### Execution Options

#### Command Line
```bash
# Run all quiz tests
npm run e2e:quiz

# Run with UI for debugging
npm run e2e:quiz:ui

# Run specific test file
npx playwright test e2e/quiz.spec.ts

# Run with browser visible
npm run e2e:quiz:headed
```

#### VS Code
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run Task: `test-quiz`
3. Or use the Test Explorer extension

### Test Reports
- HTML Report: `playwright-report-quiz/index.html`
- JSON Results: `test-results-quiz.json`
- Screenshots: Captured on failure
- Videos: Recorded on failure
- Traces: Available for failed tests

## Environment Setup

### Required Configuration
1. **User Secrets**: QuizAPI.io API key configured
2. **CORS**: Enabled for localhost:4200
3. **SignalR**: Hub properly configured
4. **Service Lifetimes**: Scoped services for proper DI

### Mock vs Real API
Tests can run with:
- **Real API**: Uses QuizAPI.io service with actual questions
- **Mock API**: Uses fallback questions when API is unavailable
- **API Simulation**: Playwright route interception for testing

## Troubleshooting

### Common Issues
1. **Timeout Errors**: Increase timeout in config file
2. **API Key Issues**: Check user secrets configuration
3. **Service Errors**: Verify backend service registration
4. **SignalR Failures**: Check hub connection and CORS

### Debug Mode
Use debug mode to step through tests:
```bash
npm run e2e:quiz:debug
```

### Browser Console
Check browser console for JavaScript errors during test execution.

## Best Practices

### Test Structure
1. Use descriptive test names
2. Include proper setup/teardown
3. Validate both positive and negative scenarios
4. Test edge cases and error conditions

### Performance Guidelines
1. Set reasonable timeout expectations
2. Test with realistic user interaction speeds
3. Validate memory usage patterns
4. Test concurrent user scenarios

### Maintenance
1. Update test data attributes if UI changes
2. Adjust timeouts based on API performance
3. Review test coverage regularly
4. Update mock data to match API changes

import { Component, Input } from '@angular/core';

export interface QuizData {
  type: 'quiz_started' | 'quiz_continue' | 'quiz_completed' | 'quiz_status';
  category?: string;
  difficulty?: string;
  totalQuestions?: number;
  score?: number;
  currentQuestion?: {
    number: number;
    total: number;
    question: string;
    answers: {
      answer_a?: string;
      answer_b?: string;
      answer_c?: string;
      answer_d?: string;
    };
  };
  isCorrect?: boolean;
  explanation?: string;
  finalResult?: {
    finalScore: number;
    totalQuestions: number;
    percentage: number;
    grade: string;
    duration: {
      minutes: number;
      seconds: number;
    };
  };
}

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent {
  @Input() quizData!: QuizData;

  formatQuizStarted(data: QuizData): string {
    const categoryText = data.category ? ` in ${data.category}` : '';
    const difficultyText = data.difficulty ? ` (${data.difficulty} level)` : '';
    
    return `
      <div class="quiz-container">
        <div class="quiz-header">
          <div class="quiz-title">
            <span class="quiz-icon">🎯</span>
            <strong>Quiz Started!</strong>${categoryText}${difficultyText}
          </div>
        </div>
        
        <div class="quiz-progress">
          <div class="progress-info">
            <span class="progress-label">Questions:</span> <span class="progress-value">${data.totalQuestions}</span>
            <span class="separator">•</span>
            <span class="progress-label">Score:</span> <span class="progress-value">${data.score}/${data.totalQuestions}</span>
          </div>
        </div>
        
        ${this.formatQuestion(data.currentQuestion!)}
        
        <div class="quiz-instruction">
          <span class="instruction-icon">💡</span>
          <span class="instruction-text">Type your answer (A, B, C, or D) to continue!</span>
        </div>
      </div>
    `;
  }

  formatQuizContinue(data: QuizData): string {
    const feedback = data.isCorrect 
      ? '<span class="feedback-correct">✅ <strong>CORRECT!</strong> 🎉</span>' 
      : '<span class="feedback-incorrect">❌ <strong>INCORRECT</strong> 😔</span>';
    
    const explanation = data.explanation 
      ? `<div class="quiz-explanation">
           <span class="explanation-icon">💡</span>
           <div class="explanation-content">
             <strong>Explanation:</strong> ${data.explanation}
           </div>
         </div>` 
      : '';
    
    return `
      <div class="quiz-container">
        <div class="quiz-feedback">${feedback}</div>
        
        ${explanation}
        
        <div class="quiz-progress">
          <div class="progress-info">
            <span class="progress-label">Score:</span> <span class="progress-value">${data.score}/${data.totalQuestions}</span>
          </div>
        </div>
        
        ${this.formatQuestion(data.currentQuestion!)}
        
        <div class="quiz-instruction">
          <span class="instruction-icon">💡</span>
          <span class="instruction-text">Type your answer (A, B, C, or D) to continue!</span>
        </div>
      </div>
    `;
  }

  formatQuizCompleted(data: QuizData): string {
    const feedback = data.isCorrect 
      ? '✅ <strong>CORRECT!</strong> 🎉' 
      : '❌ <strong>INCORRECT</strong> 😔';
    
    const explanation = data.explanation 
      ? `<div class="quiz-explanation">💡 <strong>Explanation:</strong> ${data.explanation}</div>` 
      : '';
    
    if (data.finalResult) {
      const result = data.finalResult;
      const emoji = this.getScoreEmoji(result.percentage);
      const gradeEmoji = this.getGradeEmoji(result.grade);
      const encouragement = this.getEncouragement(result.percentage);
      
      return `
        <div class="quiz-feedback">${feedback}</div>
        ${explanation}
        <div class="quiz-completion">
          <div class="completion-header">
            ${emoji} <strong>🎉 QUIZ COMPLETE! 🎉</strong>
          </div>
          <div class="completion-separator">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
          <div class="completion-stats">
            📊 <strong>Final Score:</strong> ${result.finalScore}/${result.totalQuestions} (${result.percentage.toFixed(1)}%)<br>
            🎯 <strong>Grade:</strong> ${gradeEmoji} <strong>${result.grade}</strong> ${gradeEmoji}<br>
            ⏱️ <strong>Time:</strong> ${result.duration.minutes}m ${result.duration.seconds}s
          </div>
          <div class="completion-message">💬 ${encouragement}</div>
          <div class="completion-separator">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
          <div class="completion-cta">🚀 <strong>Ready for another challenge?</strong> Say 'start quiz' to play again!</div>
        </div>
      `;
    }
    
    return `
      <div class="quiz-feedback">${feedback}</div>
      ${explanation}
      <div class="completion-simple">🎉 Quiz completed! Great job!</div>
    `;
  }

  formatQuizStatus(data: QuizData): string {
    const categoryText = data.category ? ` (${data.category})` : '';
    
    return `
      <div class="quiz-header">
        🎯 <strong>Active Quiz${categoryText}</strong>
      </div>
      <div class="quiz-stats">
        📊 <strong>Score:</strong> ${data.score}/${data.totalQuestions} | <strong>Progress:</strong> ${data.currentQuestion!.number}/${data.currentQuestion!.total}
      </div>
      ${this.formatQuestion(data.currentQuestion!)}
      <div class="quiz-instruction">
        💡 <strong>Type your answer (A, B, C, or D) to continue!</strong>
      </div>
    `;
  }

  private formatQuestion(question: any): string {
    const answers = this.formatAnswers(question.answers);
    
    return `
      <div class="quiz-question">
        <div class="question-header">
          <span class="question-number">Question ${question.number} of ${question.total}</span>
        </div>
        
        <div class="question-content">
          <div class="question-text">
            <span class="question-icon">❓</span>
            <span class="question-body">${question.question}</span>
          </div>
          
          <div class="question-answers-container">
            <ul class="question-answers">
              ${answers}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private formatAnswers(answers: any): string {
    const letters = ['A', 'B', 'C', 'D'];
    const answerKeys = ['answer_a', 'answer_b', 'answer_c', 'answer_d'];
    const options: string[] = [];

    for (let i = 0; i < answerKeys.length && i < letters.length; i++) {
      if (answers[answerKeys[i]]) {
        options.push(`
          <li class="answer-option">
            <span class="answer-label">${letters[i]}</span>
            <span class="answer-text">${answers[answerKeys[i]]}</span>
          </li>
        `);
      }
    }

    return options.join('');
  }

  private getScoreEmoji(percentage: number): string {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🥇';
    if (percentage >= 70) return '🥈';
    if (percentage >= 60) return '🥉';
    return '📚';
  }

  private getGradeEmoji(grade: string): string {
    switch (grade) {
      case 'A+': return '⭐';
      case 'A': return '🌟';
      case 'B+': return '✨';
      case 'B': return '💫';
      case 'C+': return '⚡';
      case 'C': return '🔥';
      default: return '💪';
    }
  }

  private getEncouragement(percentage: number): string {
    if (percentage >= 90) return 'Outstanding! You\'re a quiz master! 🌟';
    if (percentage >= 80) return 'Excellent work! Great knowledge! 👏';
    if (percentage >= 70) return 'Good job! You did well! 👍';
    if (percentage >= 60) return 'Not bad! Keep learning! 📖';
    return 'Keep practicing! You\'ll get better! 💪';
  }

  getFormattedContent(): string {
    switch (this.quizData.type) {
      case 'quiz_started':
        return this.formatQuizStarted(this.quizData);
      case 'quiz_continue':
        return this.formatQuizContinue(this.quizData);
      case 'quiz_completed':
        return this.formatQuizCompleted(this.quizData);
      case 'quiz_status':
        return this.formatQuizStatus(this.quizData);
      default:
        return '';
    }
  }
}

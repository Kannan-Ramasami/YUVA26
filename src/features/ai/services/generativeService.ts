import type { Concept, Question } from '../../diagnostic/types';
import type { LearnerConceptState } from '../../../types/evidence';
import { ActionType } from '../../adaptive/decisionEngine/types';

export type AIRequestType = 
  | 'EXPLAIN_DIFFERENTLY'
  | 'GIVE_EXAMPLE'
  | 'GIVE_HINT'
  | 'WHY_WRONG'
  | 'NEW_PRACTICE';

export interface AIContext {
  concept: Concept;
  subjectId: string;
  learnerState: LearnerConceptState;
  currentAction: ActionType;
  currentQuestion?: Question;
  selectedAnswer?: string;
}

export interface AIResponse {
  content: string;
  type: AIRequestType;
  newQuestion?: Question; // Only if type === 'NEW_PRACTICE'
}

export class GenerativeEducationalService {
  /**
   * Main entrypoint for educational AI requests.
   * This handles fallback, structured prompts, and error recovery.
   */
  public async generateEducationalContent(
    type: AIRequestType, 
    context: AIContext
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildStructuredPrompt(type, context);
      
      // Attempt to call the API (Mocked here for the prototype)
      const response = await this.callGeminiAPI(prompt, type, context);
      
      return response;
    } catch (error) {
      console.error('GenAI Service Error:', error);
      // Fallback mechanism ensuring core learning is never blocked
      return this.getFallbackContent(type, context);
    }
  }

  /**
   * Constructs the strongly structured prompt ensuring the AI understands its boundaries.
   */
  private buildStructuredPrompt(type: AIRequestType, context: AIContext): string {
    const { concept, learnerState, currentAction, currentQuestion, selectedAnswer } = context;
    
    let basePrompt = `
You are an expert educational AI tutor.
Your role is strictly educational. You DO NOT evaluate final mastery, unlock content, or alter learning paths.
You must adapt your language to a learner who currently has a mastery score of ${learnerState.mastery_score}/100 on ${concept.name}.
Current Adaptive Action: ${currentAction}
`;

    switch (type) {
      case 'EXPLAIN_DIFFERENTLY':
        basePrompt += `
Task: Explain the concept of "${concept.name}" using a completely different analogy than standard textbook definitions. 
Target difficulty: Match the learner's mastery (${learnerState.mastery_score < 50 ? 'simple terms' : 'advanced nuance'}).
`;
        break;
      case 'GIVE_EXAMPLE':
        basePrompt += `
Task: Provide a concrete, real-world example of "${concept.name}".
`;
        break;
      case 'GIVE_HINT':
        basePrompt += `
Task: Provide a subtle hint for the following question without giving away the answer.
Question: "${currentQuestion?.prompt || currentQuestion?.text}"
`;
        break;
      case 'WHY_WRONG':
        basePrompt += `
Task: The learner answered "${selectedAnswer}" to the question "${currentQuestion?.prompt || currentQuestion?.text}". The correct answer is "${currentQuestion?.correct_answer}".
Explain gently why their answer is incorrect and clear up the likely misconception.
`;
        break;
      case 'NEW_PRACTICE':
        basePrompt += `
Task: Generate exactly ONE new practice question (multiple choice) for the concept "${concept.name}".
Format strictly as JSON with fields: prompt, options (array of 4 strings), correct_answer, explanation, difficulty ("easy", "medium", or "hard").
`;
        break;
    }

    return basePrompt;
  }

  /**
   * Simulates the external API call to Gemini.
   */
  private async callGeminiAPI(_prompt: string, type: AIRequestType, context: AIContext): Promise<AIResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simulate occasional API failure (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('503 Service Unavailable');
    }

    // Return mocked AI responses based on the prompt
    let content = '';
    let newQuestion: Question | undefined;

    switch (type) {
      case 'EXPLAIN_DIFFERENTLY':
        content = `Imagine ${context.concept.name} like a well-organized filing cabinet. Instead of tossing everything in one box, you use folders to make finding things much faster and more reliable.`;
        break;
      case 'GIVE_EXAMPLE':
        content = `For example, if you are building a shopping cart app, a ${context.concept.name} is exactly how you would store the list of items a user intends to buy before checkout.`;
        break;
      case 'GIVE_HINT':
        content = `Think about what happens to the data type when you wrap a number in quotation marks. Is it still a number?`;
        break;
      case 'WHY_WRONG':
        content = `You selected "${context.selectedAnswer}", which is a common mistake! Remember that in Python, '==' checks for equality, while '=' is used strictly for assignment. You were trying to assign a value, not compare it.`;
        break;
      case 'NEW_PRACTICE':
        content = "Here is a brand new practice question for you!";
        newQuestion = {
          id: `ai_gen_${crypto.randomUUID()}`,
          concept_id: context.concept.id,
          type: 'MCQ',
          difficulty: context.learnerState.mastery_score > 60 ? 'hard' : 'medium',
          prompt: `Which keyword is used in Python to define a new ${context.concept.name.toLowerCase()}?`,
          options: ['def', 'func', 'define', 'function'],
          correct_answer: 'def',
          explanation: 'In Python, the "def" keyword is specifically used to begin the definition of a function.',
          metadata: { generated_by_ai: true }
        };
        break;
    }

    return { content, type, newQuestion };
  }

  /**
   * Fallback content when AI is unreachable or fails safety checks.
   */
  private getFallbackContent(type: AIRequestType, context: AIContext): AIResponse {
    let content = 'The AI assistant is currently unavailable, but keep going! ';
    
    switch (type) {
      case 'EXPLAIN_DIFFERENTLY':
        content = `Review the core lesson materials for ${context.concept.name}.`;
        break;
      case 'GIVE_HINT':
        content = context.currentQuestion?.hint || 'Try reviewing the lesson above before attempting again.';
        break;
      case 'WHY_WRONG':
        content = context.currentQuestion?.explanation || `The correct answer is ${context.currentQuestion?.correct_answer}.`;
        break;
      case 'NEW_PRACTICE':
        content = "Unable to generate a new question right now. Let's continue with the standard path.";
        break;
      default:
        content = `You're working on ${context.concept.name}. You've got this!`;
    }

    return { content, type };
  }
}

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Schema } from '@google/generative-ai';
import type { Concept, Question } from '../../diagnostic/types';
import type { LearnerConceptState } from '../../../types/evidence';
import { ActionType } from '../../adaptive/decisionEngine/types';
import { supabase } from '../../../lib/supabase';

export type AIRequestType = 
  | 'EXPLAIN_DIFFERENTLY'
  | 'GIVE_EXAMPLE'
  | 'GIVE_HINT'
  | 'WHY_WRONG'
  | 'NEW_PRACTICE'
  | 'REVIEW_SUMMARY'
  | 'CHALLENGE_CONTENT'
  | 'DAILY_THOUGHT'
  | 'GENERATE_DIAGNOSTIC';

export interface AIContext {
  concept?: Concept;
  subjectId: string;
  learnerState: LearnerConceptState;
  currentAction: ActionType;
  currentQuestion?: Question;
  selectedAnswer?: string;
  learnerLevel?: string;
  topicName?: string;
}

export interface AIResponse {
  content: string;
  type: AIRequestType;
  newQuestion?: Question; // Only if type === 'NEW_PRACTICE' or 'CHALLENGE_CONTENT'
  diagnosticQuestions?: Question[]; // Only for GENERATE_DIAGNOSTIC
}

const PROMPT_VERSION = 'edu-v1';
const MODEL_NAME = 'gemini-1.5-flash';

export class GenerativeEducationalService {
  private ai: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenerativeAI(apiKey);
      this.model = this.ai.getGenerativeModel({ model: MODEL_NAME });
    }
  }

  /**
   * Main entrypoint for educational AI requests.
   * This handles fallback, structured prompts, caching, and error recovery.
   */
  public async generateEducationalContent(
    type: AIRequestType, 
    context: AIContext
  ): Promise<AIResponse> {
    try {
      // 1. Check cache first to save requests (except for dynamic interactions like WHY_WRONG with user-specific answers)
      if (this.isCacheable(type)) {
        const cached = await this.checkCache(type, context);
        if (cached) return cached;
      }

      // 2. Build structured prompt
      const { prompt, schema } = this.buildStructuredPrompt(type, context);
      
      // 3. Attempt to call Gemini API
      const response = await this.callGeminiAPI(prompt, schema, type, context);
      
      // 4. Validate and Persist to DB
      await this.persistContent(type, context, response);

      return response;
    } catch (error) {
      console.error('[Gemini AI] Service Error:', error);
      // 5. Fallback mechanism ensuring core learning is never blocked
      return this.getFallbackContent(type, context);
    }
  }

  private isCacheable(type: AIRequestType): boolean {
    return ['EXPLAIN_DIFFERENTLY', 'GIVE_EXAMPLE', 'DAILY_THOUGHT'].includes(type);
  }

  private async checkCache(type: AIRequestType, context: AIContext): Promise<AIResponse | null> {
    try {
      const difficulty = context.learnerState ? this.getDifficultyForState(context.learnerState) : 'MEDIUM';
      const { data } = await supabase
        .from('generated_content')
        .select('content')
        .eq('concept_id', context.concept?.id || 'diagnostic')
        .eq('content_type', type)
        .eq('learner_level', context.learnerLevel || 'BEGINNER')
        .eq('difficulty', difficulty)
        .eq('prompt_version', PROMPT_VERSION)
        .limit(1);

      if (data && data.length > 0) {
        if (type === 'GENERATE_DIAGNOSTIC') return { content: "Loaded from cache", type, diagnosticQuestions: data[0].content };
        return data[0].content as AIResponse;
      }
    } catch (e) {
      // Ignore cache error, proceed to generate
    }
    return null;
  }

  private async persistContent(type: AIRequestType, context: AIContext, response: AIResponse) {
    try {
      const difficulty = context.learnerState ? this.getDifficultyForState(context.learnerState) : 'MEDIUM';
      await supabase.from('generated_content').insert({
        student_id: context.learnerState?.student_id || 'unknown',
        topic_id: context.subjectId,
        concept_id: context.concept?.id || 'diagnostic',
        content_type: type,
        difficulty,
        learner_level: context.learnerLevel || 'BEGINNER',
        prompt_version: PROMPT_VERSION,
        model_name: MODEL_NAME,
        model_version: 'latest',
        content: response
      });
    } catch (e) {
      console.error('[Gemini AI] Failed to persist generated content', e);
    }
  }

  private getDifficultyForState(state: LearnerConceptState): string {
    if (state.mastery_score < 40) return 'EASY';
    if (state.mastery_score < 80) return 'MEDIUM';
    return 'HARD';
  }

  /**
   * Constructs the strongly structured prompt ensuring the AI understands its boundaries.
   */
  private buildStructuredPrompt(type: AIRequestType, context: AIContext): { prompt: string, schema?: Schema } {
    const { concept, learnerState, currentAction, currentQuestion, selectedAnswer, learnerLevel, topicName } = context;
    const difficulty = learnerState ? this.getDifficultyForState(learnerState) : 'MEDIUM';
    const knowledgeProb = learnerState ? (learnerState.knowledge_probability || (learnerState.mastery_score / 100)) : 0.0;
    
    let basePrompt = `
You are an expert educational AI tutor working within the MasteryFlow Adaptive Learning System.
CRITICAL RULES:
1. Your role is strictly educational content generation.
2. You DO NOT evaluate final mastery, unlock content, or decide the next adaptive action.
3. The system has already decided the next action is: ${currentAction}.
4. Target Concept: "${concept.name}" (${concept.description}).
5. Learner's overall level: ${learnerLevel || 'BEGINNER'}.
6. Learner's current BKT knowledge probability for this concept: ${knowledgeProb.toFixed(2)}.
7. Target difficulty for generated content: ${difficulty}.

Adapt your language and technical depth to the learner's overall level.
`;

    let schema: Schema | undefined;

    switch (type) {
      case 'EXPLAIN_DIFFERENTLY':
        basePrompt += `\nTask: Explain the concept of "${concept.name}" using an intuitive, real-world analogy. Keep it concise.`;
        break;
      case 'GIVE_EXAMPLE':
        basePrompt += `\nTask: Provide a concrete, small code example of "${concept.name}" in Python. Explain how it works briefly.`;
        break;
      case 'GIVE_HINT':
        basePrompt += `\nTask: Provide a subtle hint for the following question without giving away the final answer.
Question: "${currentQuestion?.prompt || currentQuestion?.text}"`;
        break;
      case 'WHY_WRONG':
        basePrompt += `\nTask: The learner answered "${selectedAnswer}" to the question "${currentQuestion?.prompt || currentQuestion?.text}". The correct answer is "${currentQuestion?.correct_answer}".
Explain gently why their answer is incorrect and clear up the likely misconception. Keep it very encouraging.`;
        break;
      case 'REVIEW_SUMMARY':
        basePrompt += `\nTask: Provide a concise, 3-bullet-point summary of "${concept.name}" for a student doing a spaced review.`;
        break;
      case 'DAILY_THOUGHT':
        basePrompt += `\nTask: Generate a very short (1 sentence) fun fact or motivational thought about computer science or Python.`;
        break;
      case 'NEW_PRACTICE':
      case 'CHALLENGE_CONTENT':
        basePrompt += `\nTask: Generate exactly ONE new practice question (multiple choice) for the concept "${concept.name}".
Difficulty MUST be ${difficulty}.
Return exactly the structured JSON format specified.`;
        schema = {
          type: SchemaType.OBJECT,
          properties: {
            prompt: { type: SchemaType.STRING, description: "The text of the question" },
            options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Exactly 4 multiple choice options" },
            correct_answer: { type: SchemaType.STRING, description: "The correct option exactly as it appears in the options array" },
            explanation: { type: SchemaType.STRING, description: "Explanation of why the correct answer is correct" }
          },
          required: ["prompt", "options", "correct_answer", "explanation"]
        };
        break;
      case 'GENERATE_DIAGNOSTIC':
        basePrompt = `You are an expert educational AI tutor.
Task: The student wants to learn about the topic "${topicName}".
Identify 4-8 core concepts within this topic (including some basic prerequisites).
Generate exactly 6-8 diagnostic multiple choice questions covering these concepts (a mix of easy, medium, and hard).
Return exactly the structured JSON format specified.`;
        schema = {
          type: SchemaType.OBJECT,
          properties: {
            questions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  concept_name: { type: SchemaType.STRING, description: "The name of the concept being tested" },
                  prompt: { type: SchemaType.STRING, description: "The text of the question" },
                  options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Exactly 4 multiple choice options" },
                  correct_answer: { type: SchemaType.STRING, description: "The correct option exactly as it appears in the options array" },
                  explanation: { type: SchemaType.STRING, description: "Explanation of why the correct answer is correct" },
                  difficulty: { type: SchemaType.STRING, description: "One of: easy, medium, hard" }
                },
                required: ["concept_name", "prompt", "options", "correct_answer", "explanation", "difficulty"]
              }
            }
          },
          required: ["questions"]
        };
        break;
    }

    return { prompt: basePrompt, schema };
  }

  /**
   * Calls the Gemini API using @google/generative-ai
   */
  private async callGeminiAPI(prompt: string, schema: Schema | undefined, type: AIRequestType, context: AIContext): Promise<AIResponse> {
    if (!this.model) {
      console.warn('[Gemini AI] API key missing. Using fallback mock content.');
      return this.getFallbackContent(type, context);
    }

    let config: any = {
      temperature: 0.7,
    };

    if (schema) {
      config.responseMimeType = "application/json";
      config.responseSchema = schema;
    }

    const result = await this.model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: config
    });
    
    const responseText = result.response.text();

    if (schema) {
      try {
        const parsed = JSON.parse(responseText);
        
        // Validate required fields
        if (!parsed.prompt || !parsed.options || parsed.options.length < 2 || !parsed.correct_answer) {
          throw new Error('Invalid JSON structure returned by Gemini');
        }

        if (type === 'GENERATE_DIAGNOSTIC') {
           const generatedQuestions: Question[] = parsed.questions.map((q: any) => ({
             id: `diag_gen_${crypto.randomUUID()}`,
             concept_id: 'concept_' + q.concept_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
             concept_name: q.concept_name, // Store name temporarily to pass to UI
             type: 'MCQ',
             difficulty: q.difficulty.toLowerCase() as any,
             text: q.prompt, // use text instead of prompt for diagnostic
             prompt: q.prompt,
             options: q.options,
             correct_answer: q.correct_answer,
             explanation: q.explanation,
             metadata: { generated_by_ai: true, topic: context.topicName }
           }));
           return {
             content: "Generated diagnostic questions",
             type,
             diagnosticQuestions: generatedQuestions
           };
        }

        const newQuestion: Question = {
          id: `ai_gen_${crypto.randomUUID()}`,
          concept_id: context.concept?.id || 'unknown',
          type: 'MCQ',
          difficulty: context.learnerState ? this.getDifficultyForState(context.learnerState).toLowerCase() as any : 'medium',
          prompt: parsed.prompt,
          options: parsed.options,
          correct_answer: parsed.correct_answer,
          explanation: parsed.explanation,
          metadata: { generated_by_ai: true, prompt_version: PROMPT_VERSION }
        };

        return {
          content: "Here is a new question for you!",
          type,
          newQuestion
        };
      } catch (e) {
        console.error('[Gemini AI] JSON parsing failed:', e);
        throw e;
      }
    } else {
      return {
        content: responseText.trim(),
        type
      };
    }
  }

  /**
   * Fallback content when AI is unreachable, fails safety checks, or lacks API key.
   */
  private getFallbackContent(type: AIRequestType, context: AIContext): AIResponse {
    let content = 'The AI assistant is currently unavailable. ';
    
    switch (type) {
      case 'EXPLAIN_DIFFERENTLY':
        content = `Review the core lesson materials for ${context.concept?.name || 'this concept'}.`;
        break;
      case 'GIVE_EXAMPLE':
        content = `Check out standard documentation examples for ${context.concept?.name || 'this concept'}.`;
        break;
      case 'GIVE_HINT':
        content = context.currentQuestion?.hint || 'Try reviewing the lesson above before attempting again.';
        break;
      case 'WHY_WRONG':
        content = context.currentQuestion?.explanation || `The correct answer is ${context.currentQuestion?.correct_answer}.`;
        break;
      case 'GENERATE_DIAGNOSTIC':
        content = "Unable to generate diagnostic right now.";
        break;
      case 'NEW_PRACTICE':
      case 'CHALLENGE_CONTENT':
        content = "Unable to generate a new question right now. Let's continue with the standard path.";
        break;
      case 'REVIEW_SUMMARY':
        content = `Key point: Practice ${context.concept?.name || 'this concept'} to maintain mastery.`;
        break;
      case 'DAILY_THOUGHT':
        content = `Keep coding! Practice makes perfect.`;
        break;
      default:
        content = `You're working on ${context.concept?.name || 'this topic'}. Keep going!`;
    }

    return { content, type };
  }
}

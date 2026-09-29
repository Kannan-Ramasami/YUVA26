import type { Concept, Question } from '../types';

export const PYTHON_CONCEPTS: Concept[] = [
  { id: 'c_py_var', subject_id: 'sub_python', name: 'Variables', description: 'Variable assignment and naming.' },
  { id: 'c_py_type', subject_id: 'sub_python', name: 'Data Types', description: 'Ints, floats, strings, and booleans.' },
  { id: 'c_py_oper', subject_id: 'sub_python', name: 'Operators', description: 'Arithmetic, logical, and comparison operators.' },
  { id: 'c_py_cond', subject_id: 'sub_python', name: 'Conditions', description: 'If, elif, and else statements.' },
  { id: 'c_py_loop', subject_id: 'sub_python', name: 'Loops', description: 'For and while loops.' },
  { id: 'c_py_func', subject_id: 'sub_python', name: 'Functions', description: 'Defining and calling functions, arguments.' },
  { id: 'c_py_list', subject_id: 'sub_python', name: 'Lists', description: 'List creation, indexing, and methods.' },
  { id: 'c_py_dict', subject_id: 'sub_python', name: 'Dictionaries', description: 'Key-value pairs and dictionary methods.' }
];

// Note: Storing standard questions here for the prototype so they don't have to be fetched from a DB every time during early dev
export const PYTHON_QUESTIONS: Question[] = [
  // Variables
  {
    id: 'q_py_var_1',
    concept_id: 'c_py_var',
    type: 'MCQ',
    difficulty: 'easy',
    prompt: 'Which of the following is a valid variable assignment in Python?',
    options: ['x == 5', '5 = x', 'x = 5', 'let x = 5'],
    correct_answer: 'x = 5',
    explanation: 'In Python, variables are assigned using a single equals sign (=) with the variable name on the left and the value on the right.',
    hint: 'Think about which side the name should be on.'
  },
  // Data Types
  {
    id: 'q_py_type_1',
    concept_id: 'c_py_type',
    type: 'MCQ',
    difficulty: 'easy',
    prompt: 'What is the data type of the value 3.14?',
    options: ['int', 'float', 'string', 'boolean'],
    correct_answer: 'float',
    explanation: 'Any number with a decimal point is represented as a float (floating-point number) in Python.'
  },
  // Operators
  {
    id: 'q_py_oper_1',
    concept_id: 'c_py_oper',
    type: 'multiple_choice',
    difficulty: 'medium',
    text: 'What is the result of 10 % 3?',
    options: ['3', '3.33', '1', '0'],
    correct_answer: '1'
  },
  // Conditions
  {
    id: 'q_py_cond_1',
    concept_id: 'c_py_cond',
    type: 'true_false',
    difficulty: 'easy',
    text: 'In Python, "elif" is used to check multiple expressions for truth value.',
    options: ['True', 'False'],
    correct_answer: 'True'
  },
  // Loops
  {
    id: 'q_py_loop_1',
    concept_id: 'c_py_loop',
    type: 'multiple_choice',
    difficulty: 'medium',
    text: 'Which loop is best used when you know exactly how many times you want to iterate?',
    options: ['while loop', 'for loop', 'do-while loop', 'infinite loop'],
    correct_answer: 'for loop'
  },
  // Functions
  {
    id: 'q_py_func_1',
    concept_id: 'c_py_func',
    type: 'short_answer',
    difficulty: 'medium',
    text: 'What keyword is used to define a function in Python?',
    correct_answer: 'def'
  },
  // Lists
  {
    id: 'q_py_list_1',
    concept_id: 'c_py_list',
    type: 'multiple_choice',
    difficulty: 'medium',
    text: 'How do you access the first element of a list named "my_list"?',
    options: ['my_list[1]', 'my_list[0]', 'my_list.first()', 'my_list(0)'],
    correct_answer: 'my_list[0]'
  },
  // Dictionaries
  {
    id: 'q_py_dict_1',
    concept_id: 'c_py_dict',
    type: 'multiple_choice',
    difficulty: 'hard',
    text: 'How do you add a new key-value pair to a dictionary "d"?',
    options: ['d.add("key", "value")', 'd["key"] = "value"', 'd.insert("key", "value")', 'd.append("key", "value")'],
    correct_answer: 'd["key"] = "value"'
  }
];

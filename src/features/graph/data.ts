import type { ConceptPrerequisite } from './types';

// Data Types ← Variables
// Operators ← Data Types
// Conditions ← Operators
// Loops ← Conditions
// Functions ← Loops
// Lists ← Data Types
// Dictionaries ← Data Types

export const PYTHON_PREREQUISITES: ConceptPrerequisite[] = [
  {
    id: 'prereq_1',
    concept_id: 'c_py_type', // Data Types
    prerequisite_concept_id: 'c_py_var', // Variables
    relationship_type: 'REQUIRED',
    minimum_mastery: 70
  },
  {
    id: 'prereq_2',
    concept_id: 'c_py_oper', // Operators
    prerequisite_concept_id: 'c_py_type', // Data Types
    relationship_type: 'REQUIRED',
    minimum_mastery: 70
  },
  {
    id: 'prereq_3',
    concept_id: 'c_py_cond', // Conditions
    prerequisite_concept_id: 'c_py_oper', // Operators
    relationship_type: 'REQUIRED',
    minimum_mastery: 70
  },
  {
    id: 'prereq_4',
    concept_id: 'c_py_loop', // Loops
    prerequisite_concept_id: 'c_py_cond', // Conditions
    relationship_type: 'REQUIRED',
    minimum_mastery: 70
  },
  {
    id: 'prereq_5',
    concept_id: 'c_py_func', // Functions
    prerequisite_concept_id: 'c_py_loop', // Loops
    relationship_type: 'REQUIRED',
    minimum_mastery: 70
  },
  {
    id: 'prereq_6',
    concept_id: 'c_py_list', // Lists
    prerequisite_concept_id: 'c_py_type', // Data Types
    relationship_type: 'REQUIRED',
    minimum_mastery: 60
  },
  {
    id: 'prereq_7',
    concept_id: 'c_py_dict', // Dictionaries
    prerequisite_concept_id: 'c_py_type', // Data Types
    relationship_type: 'REQUIRED',
    minimum_mastery: 60
  }
];

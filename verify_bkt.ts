import { processAttemptBKT, recalculateConceptKnowledge, DEFAULT_BKT_CONFIG } from './src/services/bktService';

function runBKTVerification() {
  console.log("Starting BKT Verification...");
  console.log("Config:", DEFAULT_BKT_CONFIG);
  
  // Test 1: Single Concept Flow
  console.log("\n--- SINGLE CONCEPT FLOW ---");
  const concept1 = 'c_python_variables';
  
  // 1. Initial knowledge
  const p0 = DEFAULT_BKT_CONFIG.initial_knowledge;
  console.log(`Initial P(Know): ${p0}`);
  
  // 2. Submit correct attempt
  const res1 = processAttemptBKT(concept1, p0, true);
  const p1 = res1.knowledge_probability;
  console.log(`P(Know) after correct attempt: ${p1}`);
  
  // 4. Submit another correct attempt
  const res2 = processAttemptBKT(concept1, p1, true);
  const p2 = res2.knowledge_probability;
  console.log(`P(Know) after second correct attempt: ${p2}`);
  
  // 6. Submit an incorrect attempt
  const res3 = processAttemptBKT(concept1, p2, false);
  const p3 = res3.knowledge_probability;
  console.log(`P(Know) after incorrect attempt: ${p3}`);
  
  // 8. Verify attempt history (recalculation)
  const history = [
    { correctness: true },
    { correctness: true },
    { correctness: false }
  ];
  const pRecalc = recalculateConceptKnowledge(history);
  console.log(`\nAttempt history [True, True, False] recalculation matches sequential: ${Math.abs(pRecalc - p3) < 0.001}`);
  console.log(`Recalculated P(Know): ${pRecalc}`);

  // 9. Verify order dependence
  const historyReversed = [
    { correctness: false },
    { correctness: true },
    { correctness: true }
  ];
  const pRecalcReversed = recalculateConceptKnowledge(historyReversed);
  console.log(`Recalculated P(Know) [False, True, True]: ${pRecalcReversed}`);
  console.log(`Calculation depends on attempt order: ${Math.abs(pRecalc - pRecalcReversed) > 0.001}`);
  
  // 10. Verify repeated guessing (rapid incorrectness/correctness)
  const rapidGuesses = Array(10).fill(0).map((_, i) => ({ correctness: i % 2 === 0 })); // True, False, True, False...
  const pRapid = recalculateConceptKnowledge(rapidGuesses);
  console.log(`\nP(Know) after 10 rapid alternating guesses: ${pRapid}`);
  console.log(`Repeated guessing does not unrealistically produce mastery: ${pRapid < 0.8}`);

  // 11. Verify independent states
  const concept2 = 'c_python_loops';
  const c2res = processAttemptBKT(concept2, null, false);
  console.log(`\nP(Know) for independent concept (loops) after failure: ${c2res.knowledge_probability}`);
  console.log(`Concepts remain independent: ${c2res.knowledge_probability !== p3}`);

  // 12. Verify deterministic
  const pRecalc2 = recalculateConceptKnowledge(history);
  console.log(`BKT is deterministic (re-running same history yields same result): ${pRecalc === pRecalc2}`);
  
  console.log("\nALL CHECKS COMPLETED.");
}

runBKTVerification();

export const mockAiResponse = {
  errorFound: true,
  errorIndex: 1,
  errorCategory: "Conceptual Misunderstanding",
  steps: [
    { stepNumber: 1, text: "u = 10, v = 30, t = 5", isCorrect: true, explanation: "Correctly identified initial variables." },
    { stepNumber: 2, text: "a = (v + u) / t", isCorrect: false, explanation: "Used addition instead of subtraction." },
    { stepNumber: 3, text: "a = 40 / 5 = 8 m/s²", isCorrect: true, explanation: "Arithmetic is correct." }
  ],
  hints: [ "What does acceleration actually measure?", "Think about 'change' between final and initial." ]
};

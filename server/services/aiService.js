const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildGenerationPrompt(topics, config) {
  const { questionTypes, difficulty, bloomsEnabled } = config;

  const typeInstructions = Object.entries(questionTypes)
    .filter(([, cfg]) => cfg.enabled)
    .map(([type, cfg]) => {
      const labels = {
        mcq: 'Multiple Choice (4 options, indicate correct answer)',
        short: 'Short Answer (2-5 sentences)',
        long: 'Long Answer (detailed essay)',
        truefalse: 'True/False (with 1 sentence justification)',
        fillblank: 'Fill in the Blank (use _____ for blank)',
      };
      return `- ${labels[type] || type}: ${cfg.count} questions, ${cfg.marksEach} marks each`;
    }).join('\n');

  const topicList = topics.map((t, i) => `${i + 1}. ${t}`).join('\n');

  return `You are an expert professor creating college exam questions.

TOPICS:
${topicList}

QUESTION REQUIREMENTS:
${typeInstructions}

DIFFICULTY: ${difficulty === 'mixed' ? 'Mix of easy, medium, and hard' : difficulty}
${bloomsEnabled ? "BLOOM'S TAXONOMY: Tag each question with one of: Remember, Understand, Apply, Analyze, Evaluate, Create" : ''}

STRICT OUTPUT RULES:
- Respond with ONLY a valid JSON array
- No markdown, no code fences, no explanation text
- No text before or after the array
- Start your response with [ and end with ]

Each question object must have exactly these fields:
{
  "type": "mcq" or "short" or "long" or "truefalse" or "fillblank",
  "question": "full question text here",
  "options": ["option A", "option B", "option C", "option D"],
  "answer": "correct answer or model answer",
  "topic": "topic name from the list above",
  "marks": 2,
  "difficulty": "easy" or "medium" or "hard",
  "bloomsLevel": "Remember" or "Understand" or "Apply" or "Analyze" or "Evaluate" or "Create"
}

Note: "options" field is only for MCQ type. For all other types, omit the "options" field.

QUALITY RULES:
- Questions must be college-level and academically rigorous
- Distribute questions across all provided topics evenly
- MCQ distractors must be plausible but clearly wrong to experts
- Long answer model answers must be comprehensive
- No two questions should test the exact same concept`;
}

async function generateQuestions(topics, config) {
  const prompt = buildGenerationPrompt(topics, config);

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 8000,
  });

  const raw = completion.choices[0]?.message?.content || '[]';
  const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();

  let questions;
  try {
    questions = JSON.parse(clean);
  } catch {
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) {
      questions = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  return questions.map((q, i) => ({
    ...q,
    id: `q-${Date.now()}-${i}`,
    approved: false,
  }));
}

async function regenerateQuestion({ topic, type, difficulty, bloomsLevel }) {
  const labels = {
    mcq: 'Multiple Choice (4 options)',
    short: 'Short Answer',
    long: 'Long Answer',
    truefalse: 'True/False',
    fillblank: 'Fill in the Blank',
  };

  const prompt = `Generate exactly ONE college exam question with these parameters:
- Topic: ${topic}
- Type: ${labels[type] || type}
- Difficulty: ${difficulty}
- Bloom's Level: ${bloomsLevel || 'Understand'}

Respond with ONLY a single JSON object. No markdown, no explanation, no text before or after.
Start with { and end with }

{
  "type": "${type}",
  "question": "question text here",
  ${type === 'mcq' ? '"options": ["option A", "option B", "option C", "option D"],' : ''}
  "answer": "correct answer or model answer",
  "topic": "${topic}",
  "marks": 2,
  "difficulty": "${difficulty}",
  "bloomsLevel": "${bloomsLevel || 'Understand'}"
}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();

  let question;
  try {
    question = JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    question = match ? JSON.parse(match[0]) : {};
  }

  return { ...question, id: `q-${Date.now()}`, approved: false };
}

async function extractTopicsFromText(text) {
  const truncated = text.slice(0, 6000);

  const prompt = `Extract the main academic topics and subtopics from this document text.
Return ONLY a JSON array of topic strings. No markdown, no explanation, no text before or after.
Start with [ and end with ]

Example: ["Binary Search Trees", "Graph Traversal — BFS and DFS", "Dynamic Programming — Memoization"]

Document text:
${truncated}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const raw = completion.choices[0]?.message?.content || '[]';
  const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const topics = JSON.parse(clean);
    return Array.isArray(topics) ? topics : [];
  } catch {
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  }
}

module.exports = { generateQuestions, regenerateQuestion, extractTopicsFromText };

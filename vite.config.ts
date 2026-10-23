import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

function apiDevServerPlugin() {
  return {
    name: 'api-dev-server-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = (req.url || '').split('?')[0];
        if (url === '/api/generate-sri-lankan-questions' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY_NOT_CONFIGURED' }));
                return;
              }

              const { GoogleGenAI } = await import('@google/genai');
              const params = JSON.parse(body || '{}');
              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              const isPrimary =
                params.grade?.toLowerCase().includes('grade 1') ||
                params.grade?.toLowerCase().includes('grade 2') ||
                params.grade?.toLowerCase().includes('grade 3') ||
                params.grade?.toLowerCase().includes('grade 4') ||
                params.grade?.toLowerCase().includes('grade 5') ||
                params.grade?.toLowerCase().includes('primary') ||
                params.grade?.toLowerCase().includes('scholarship') ||
                params.grade?.includes('புலமைப்பரிசில்');

              const reqOptionCount = params.optionsCount && Number(params.optionsCount) >= 2 && Number(params.optionsCount) <= 6
                ? Number(params.optionsCount)
                : isPrimary ? 3 : 4;
              const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, reqOptionCount);
              const sampleOptionsJson = JSON.stringify(optionLetters.map(l => `Option ${l}`));
              const optionRule = `Each MCQ MUST HAVE EXACTLY ${reqOptionCount} OPTIONS (${optionLetters.join(', ')}). No more and no fewer.`;

              const prompt = `
You are a Senior Sri Lankan Curriculum & Examination Specialist for the National Institute of Education (NIE) and Department of Examinations Sri Lanka.
Generate ${params.questionCount || 5} questions strictly aligned with Sri Lankan national educational standards.

Context:
- Category: ${params.examCategory || 'school_syllabus'}
- Grade/Level: ${params.grade || 'Grade 10'}
- Subject: ${params.subject || 'Mathematics'}
- Medium: ${params.medium || 'Tamil'}
- Term/Stage: ${params.term || 'Term 1'}
- Topic/Unit: ${params.unitTopic || 'Core Syllabus'}
- Curriculum Version: ${params.curriculumVersion || 'National Standard'}
- ${optionRule}
${params.referenceTextSnippet ? `Reference Extract:\n"""\n${params.referenceTextSnippet.slice(0, 3000)}\n"""` : ''}

Strict Constraints:
1. Currency: Sri Lankan Rupees (LKR / ரூபா / රු.).
2. Real-world context: Sri Lankan locations, districts, fauna, flora, history, and syllabus standards.
3. Distractors: Plausible and mathematically sound.
4. Explanations: Clear step-by-step reasoning in ${params.medium || 'Tamil'}.
5. Return JSON strictly with schema:
{
  "questions": [
    {
      "id": "sl_q1",
      "type": "${params.questionType === 'mixed' ? 'multiple_choice' : params.questionType || 'multiple_choice'}",
      "questionText": "Question text in ${params.medium || 'Tamil'}",
      "options": ${sampleOptionsJson},
      "correctAnswer": "Exact text matching one option",
      "marks": ${params.defaultMarks || 2},
      "explanation": "Clear step-by-step reasoning in ${params.medium || 'Tamil'}",
      "learningOutcome": "Competency tested",
      "referencePage": "NIE / e-Thaksalawa Unit reference",
      "difficulty": "${params.difficulty === 'Mixed' ? 'Medium' : params.difficulty || 'Medium'}"
    }
  ]
}
`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
                config: {
                  responseMimeType: 'application/json',
                  temperature: 0.4,
                },
              });

              const text = response.text || '';
              const parsed = JSON.parse(text);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, questions: parsed.questions || [] }));
            } catch (err: any) {
              console.warn('Dev server Gemini generate questions warning:', err.message);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/generate-study-timetable' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY_NOT_CONFIGURED' }));
                return;
              }

              const params = JSON.parse(body || '{}');
              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              const prompt = `
You are a Senior Sri Lankan Educational Counselor, National Olympiad Mentor, and Exam Preparation Specialist aligned with the National Institute of Education (NIE), Sri Lanka e-Thaksalawa, and Department of Examinations Sri Lanka.

Create a highly detailed, personalized 7-Day Weekly Study Timetable for this student based on their upcoming competition schedule and weak subjects identified in past results.

Student Profile:
- Name: ${params.studentName || 'Student'}
- Grade / Level: ${params.grade || 'Grade 10'}
- Curriculum Path: ${params.curriculumPath || 'Standard NIE Curriculum'}
- Language Medium: ${params.medium || params.language || 'Tamil'}
- Daily Study Time Available: ${params.dailyHours || 3} hours per day
- Preferred Study Hours: ${params.preferredTime || 'Evening (4:00 PM - 8:00 PM)'}

Upcoming Competitions & Exams to Prepare For:
${JSON.stringify(params.upcomingCompetitions || [], null, 2)}

Past Results & Academic Performance:
${JSON.stringify(params.pastResults || [], null, 2)}

Identified Weak Subjects Needing Urgent Attention:
${JSON.stringify(params.weakSubjects || [], null, 2)}

Strong Subjects:
${JSON.stringify(params.strongSubjects || [], null, 2)}

Requirements & Guidelines:
1. Strict Personalization: Prioritize the student's weak subjects with active practice, concept clarity, and past paper drills.
2. Competition Urgency: If any upcoming contest is within 7-14 days, allocate high-intensity practice blocks for that specific contest syllabus.
3. Sri Lankan Context: Reference authentic Sri Lankan learning milestones (e-Thaksalawa units, NIE competency guides, past examination questions, LKR word problems if maths).
4. Balanced Routine: Include short 5-10 min breaks between intense study sessions (Pomodoro technique) and a quick review at the end of each day.
5. All text, titles, descriptions, and tips MUST be in ${params.medium === 'en' || params.language === 'en' ? 'English' : 'Tamil (தமிழ்)'} (unless English is requested). If Tamil, use natural, encouraging Tamil academic terminology (எ.கா: பலவீனமான பாட மீளாய்வு, மாதிரி வினாத்தாள் பயிற்சி, கணித சமன்பாடுகள்).
6. Provide a complete 7-day schedule (Monday to Sunday) with 2 to 4 timed study blocks per day matching the student's daily study hours.

Output strictly valid JSON matching this schema:
{
  "timetableTitle": "string",
  "curriculumStage": "string",
  "targetWeek": "string",
  "overview": "string",
  "weakAreasIdentified": [
    {
      "subject": "string",
      "scoreNote": "string",
      "focusTopics": ["topic 1", "topic 2"],
      "recommendedDailyMinutes": 60
    }
  ],
  "upcomingContestStrategies": [
    {
      "contestTitle": "string",
      "daysRemaining": 5,
      "priority": "High",
      "strategy": "string"
    }
  ],
  "days": [
    {
      "dayName": "Monday (திங்கள்)",
      "theme": "string",
      "dailyTargetSummary": "string",
      "timeSlots": [
        {
          "id": "slot_mon_1",
          "timeRange": "04:30 PM - 05:30 PM",
          "subject": "string",
          "topic": "string",
          "sessionType": "Weak Area Booster",
          "activity": "string",
          "tips": "string",
          "intensity": "High"
        }
      ]
    }
  ],
  "aiCounselorTips": [
    "string", "string", "string"
  ]
}
`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
                config: {
                  responseMimeType: 'application/json',
                  temperature: 0.4,
                },
              });

              const text = response.text || '';
              const parsed = JSON.parse(text);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, timetable: parsed }));
            } catch (err: any) {
              console.warn('Dev server Gemini generate study timetable warning:', err.message);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (url === '/api/auto-generate-competition' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY_NOT_CONFIGURED' }));
                return;
              }

              const { GoogleGenAI } = await import('@google/genai');
              const params = JSON.parse(body || '{}');
              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              const gradeStr = (params.grade || '').toLowerCase();
              const isAdvancedLevel = gradeStr.includes('grade 12') || gradeStr.includes('grade 13') || gradeStr.includes('a/l') || gradeStr.includes('உயர்தரம்');
              const isEarlyPrimary = gradeStr.includes('grade 1') || gradeStr.includes('grade 2') || gradeStr.includes('grade 3');
              const isUpperPrimary = gradeStr.includes('grade 4') || gradeStr.includes('grade 5') || gradeStr.includes('scholarship') || gradeStr.includes('புலமைப்பரிசில்');

              let expectedOptionsCount = 4;
              let sampleOptionsJson = '["Option A", "Option B", "Option C", "Option D"]';
              let optionRule = 'SECONDARY & G.C.E. O/L RULE (Grades 6–11): Each MCQ MUST HAVE EXACTLY 4 OPTIONS: A, B, C, and D.';

              if (params.optionsCount && Number(params.optionsCount) >= 2 && Number(params.optionsCount) <= 6) {
                expectedOptionsCount = Number(params.optionsCount);
                const letters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, expectedOptionsCount);
                sampleOptionsJson = JSON.stringify(letters.map(l => `Option ${l}`));
                optionRule = `EXPLICIT CONFIGURATION RULE: Each MCQ MUST HAVE EXACTLY ${expectedOptionsCount} OPTIONS (${letters.join(', ')}). The options array MUST contain exactly ${expectedOptionsCount} items.`;
              } else if (isAdvancedLevel) {
                expectedOptionsCount = 5;
                sampleOptionsJson = '["Option A", "Option B", "Option C", "Option D", "Option E"]';
                optionRule = 'G.C.E. ADVANCED LEVEL (A/L) NATIONAL RULE (Grades 12–13): Strictly according to Sri Lankan Department of Examinations G.C.E. A/L Paper 1 standards, EACH MCQ MUST HAVE EXACTLY 5 OPTIONS: A, B, C, D, and E (Option 1, 2, 3, 4, 5).';
              } else if (isEarlyPrimary) {
                expectedOptionsCount = 3;
                sampleOptionsJson = '["Option A", "Option B", "Option C"]';
                optionRule = 'EARLY PRIMARY RULE (Grades 1–3): Each MCQ MUST HAVE EXACTLY 3 OPTIONS: A, B, and C.';
              } else if (isUpperPrimary) {
                expectedOptionsCount = 4;
                sampleOptionsJson = '["Option A", "Option B", "Option C", "Option D"]';
                optionRule = 'UPPER PRIMARY & SCHOLARSHIP RULE (Grades 4–5): Each MCQ MUST HAVE EXACTLY 4 OPTIONS: A, B, C, and D.';
              }

              const modeContextMap: Record<string, string> = {
                quiz: 'Mode: Standard Quiz (வகுப்பறை வினாடி வினா). Formative assessment questions with clear explanations.',
                exam: 'Mode: Formal Sri Lankan Examination (தவணைப் பரீட்சை). Aligned with NIE term syllabus standards, structured marks, and academic competency indicators.',
                competition: 'Mode: National Academic Olympiad / Competition (தேசிய கல்விப் போட்டி). Challenging higher-order thinking (Blooms Taxonomy), logic, and real-world problem solving.',
                island_quest: `Mode: Sri Lanka Island Quest (இலங்கைத் தீவு வினா வேட்டை). Adventure exploration across Sri Lanka’s 9 provinces and 25 districts, combining national curriculum syllabus with regional heritage, geographical landmarks, national parks, flora/fauna, and environmental stewardship${params.district ? ` with special focus on ${params.district} district` : ''}.`,
                edu_arena: 'Mode: Edu Arena Speed Challenge (கல்வி அரங்கு - நேரடி வேகச் சவால்). Rapid-fire, dynamic MCQ questions designed for fast countdown responses (15-20s per question), engaging distractors, and high energy.',
                district_quiz: `Mode: 25 Districts Championship Quiz (மாவட்ட ரீதியான வினாடி வினாப் போட்டி). Highlighting educational excellence in ${params.district || 'Sri Lankan Districts'}, testing curriculum competencies and regional context for inter-district students.`,
              };

              const modeContext = modeContextMap[params.mode as string] || 'Mode: Academic Competition / Quiz';

              const prompt = `
You are the Chief Academic Examination Specialist for the National Institute of Education (NIE), Sri Lanka and the Department of Examinations.
Generate a complete, ready-to-publish competition/quiz/exam matching these parameters:

Context:
- Generation Mode: ${params.mode || 'quiz'}
- ${modeContext}
- Subject: ${params.subject || 'Mathematics'}
- Grade / Academic Level: ${params.grade || 'Grade 10'}
- Medium / Language: ${params.medium || 'Tamil'}
- Focus District (if applicable): ${params.district || 'All-Island Sri Lanka'}
- Question Count: ${params.questionCount || 10}
- Target Duration: ${params.duration || 30} minutes
- Difficulty Level: ${params.difficulty || 'Medium'}
- ${optionRule} (Note: Each question options array MUST have exactly ${expectedOptionsCount} options).

Strict Rules:
1. Currency: Always use Sri Lankan Rupees (LKR / ரூபா / රු.).
2. Authentic Sri Lankan Context: Reference real locations, institutions, NIE competencies, e-Thaksalawa themes, and realistic problem sets.
3. Language: The title, description, questions, options, and explanations must be written in fluent, grammatically accurate ${params.medium || 'Tamil'}.
4. Return strictly JSON matching this schema:
{
  "title": "A captivating competition/quiz title in ${params.medium || 'Tamil'}",
  "description": "2-3 sentences explaining the event, objectives, and instructions in ${params.medium || 'Tamil'}",
  "competitionType": "${params.mode === 'exam' ? 'Exam' : params.mode === 'island_quest' ? 'Island Quest' : params.mode === 'edu_arena' ? 'Edu Arena' : params.mode === 'district_quiz' ? 'District Quiz' : params.mode === 'competition' ? 'Competition' : 'Quiz'}",
  "category": "${params.category || params.subject || 'General Knowledge'}",
  "subject": "${params.subject || 'General Knowledge'}",
  "grade": "${params.grade || 'Grade 10'}",
  "language": "${params.medium || 'Tamil'}",
  "duration": ${params.duration || 30},
  "district": "${params.district || ''}",
  "scope": "${params.district ? 'district' : 'all_island'}",
  "prizeDetails": {
    "firstPrize": "1st Prize Gold Medal & National Honor Certificate",
    "secondPrize": "2nd Prize Silver Medal",
    "thirdPrize": "3rd Prize Bronze Medal",
    "participationCertificate": "Digital Merit Certificate of Participation"
  },
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "questionText": "Question text in ${params.medium || 'Tamil'}",
      "options": ${sampleOptionsJson},
      "correctAnswer": "Exact text of the correct option",
      "marks": 2,
      "explanation": "Clear step-by-step reasoning and NIE textbook reference in ${params.medium || 'Tamil'}",
      "learningOutcome": "Educational competency tested",
      "difficulty": "${params.difficulty || 'Medium'}"
    }
  ]
}
`;

              const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
              let parsed: any = null;
              let lastErrorMsg = '';

              for (const mName of candidateModels) {
                try {
                  const response = await ai.models.generateContent({
                    model: mName,
                    contents: prompt,
                    config: {
                      responseMimeType: 'application/json',
                      temperature: 0.4,
                    },
                  });
                  const text = response.text || '';
                  parsed = JSON.parse(text);
                  if (parsed && parsed.title && Array.isArray(parsed.questions)) {
                    break;
                  }
                } catch (mErr: any) {
                  lastErrorMsg = mErr?.message || String(mErr);
                  console.warn(`Dev server model ${mName} notice:`, lastErrorMsg);
                  await new Promise((r) => setTimeout(r, 400));
                }
              }

              if (parsed && parsed.questions && parsed.questions.length > 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, competition: parsed, source: 'gemini' }));
                return;
              }

              // Graceful Fallback if upstream Google AI experiences 503 High Demand
              console.log('Using Sri Lankan NIE curriculum fallback generator due to 503 high demand...');
              const qCount = params.questionCount || 5;
              const medium = params.medium || 'Tamil';
              const subject = params.subject || 'Mathematics';
              const grade = params.grade || 'Grade 10';
              const district = params.district || '';
              const mode = params.mode || 'quiz';

              const fallbackQuestions = [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  questionText: medium === 'Tamil' ? '2x + 7 = 19 என்ற சமன்பாட்டைத் தீர்க்கும் போது x இன் பெறுமானம் யாது?' : 'Solve for x: 2x + 7 = 19',
                  options: isPrimary ? ['6', '5', '7'] : ['6', '5', '7', '12'],
                  correctAnswer: '6',
                  marks: 2,
                  explanation: medium === 'Tamil' ? '2x = 19 - 7 = 12 => x = 6.' : '2x = 12, therefore x = 6.',
                  learningOutcome: 'Algebraic linear equations solving competency',
                  difficulty: params.difficulty || 'Medium',
                },
                {
                  id: 'q2',
                  type: 'multiple_choice',
                  questionText: medium === 'Tamil' ? 'ஆரை 7 cm ஆகவுள்ள வட்டமொன்றின் பரப்பளவு யாது? (π = 22/7)' : 'What is the area of a circle with radius 7 cm? (π = 22/7)',
                  options: isPrimary ? ['154 cm²', '44 cm²', '88 cm²'] : ['154 cm²', '44 cm²', '88 cm²', '308 cm²'],
                  correctAnswer: '154 cm²',
                  marks: 2,
                  explanation: 'Area = πr² = (22/7) × 7 × 7 = 154 cm².',
                  learningOutcome: 'Geometric circle area computation',
                  difficulty: params.difficulty || 'Medium',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  questionText: medium === 'Tamil' ? 'தாவரங்களில் ஒளித்தொகுப்பு நடைபெறும் முக்கிய கல நுண்ணுறுப்பு எது?' : 'Which organelle is responsible for photosynthesis in plants?',
                  options: isPrimary ? ['பச்சையவுருமணி (Chloroplast)', 'இழைமணி', 'ரைபோசோம்'] : ['பச்சையவுருமணி (Chloroplast)', 'இழைமணி', 'ரைபோசோம்', 'கொல்கி உடலம்'],
                  correctAnswer: 'பச்சையவுருமணி (Chloroplast)',
                  marks: 2,
                  explanation: medium === 'Tamil' ? 'பச்சையவுருவத்தில் உள்ள பச்சையம் சூரிய ஒளியை உறிஞ்சி உணவு தயாரிக்கிறது.' : 'Chloroplasts absorb solar energy for photosynthesis.',
                  learningOutcome: 'Plant cellular biology and metabolism',
                  difficulty: params.difficulty || 'Medium',
                },
                {
                  id: 'q4',
                  type: 'multiple_choice',
                  questionText: medium === 'Tamil' ? 'திருக்குறளில் உள்ள மொத்த அதிகாரங்கள் மற்றும் குறட்பாக்களின் எண்ணிக்கை யாவை?' : 'How many chapters and couplets are there in Thirukkural?',
                  options: isPrimary ? ['133 அதிகாரங்கள், 1330 குறள்கள்', '120 அதிகாரங்கள்', '150 அதிகாரங்கள்'] : ['133 அதிகாரங்கள், 1330 குறள்கள்', '130 அதிகாரங்கள்', '120 அதிகாரங்கள்', '150 அதிகாரங்கள்'],
                  correctAnswer: '133 அதிகாரங்கள், 1330 குறள்கள்',
                  marks: 2,
                  explanation: '133 அதிகாரங்கள் × 10 குறள்கள் = 1330 குறட்பாக்கள்.',
                  learningOutcome: 'Classical literature analysis',
                  difficulty: params.difficulty || 'Medium',
                },
                {
                  id: 'q5',
                  type: 'multiple_choice',
                  questionText: medium === 'Tamil' ? 'இலங்கையில் பராக்கிரம சமுத்திரத்தைக் கட்டிய அரசன் யார்?' : 'Which Sri Lankan monarch constructed the Parakrama Samudra?',
                  options: isPrimary ? ['மகா பராக்கிரமபாகு', 'துட்டகைமுனு', 'பராக்கிரமபண்டு'] : ['மகா பராக்கிரமபாகு', 'துட்டகைமுனு', 'பராக்கிரமபண்டு', 'விஜயபாகு'],
                  correctAnswer: 'மகா பராக்கிரமபாகு',
                  marks: 2,
                  explanation: 'பண்டைய பொலன்னறுவை காலத்தில் மகா பராக்கிரமபாகு மன்னனால் கட்டப்பட்டது.',
                  learningOutcome: 'Sri Lankan hydraulic heritage and history',
                  difficulty: params.difficulty || 'Medium',
                },
              ].slice(0, qCount);

              const fallbackComp = {
                title: medium === 'Tamil' ? `${subject} • தேசிய கல்விச் சவால் (${grade})` : `${subject} • National Curriculum Challenge (${grade})`,
                description: medium === 'Tamil' ? 'இலங்கை கல்வி அமைச்சு (NIE) பாடத்திட்டத் தரநிலைகளுக்கு அமைவாகத் தயாரிக்கப்பட்ட வினாத்தாள்.' : 'National Institute of Education (NIE) Sri Lanka aligned evaluation challenge.',
                competitionType: mode === 'exam' ? 'Exam' : mode === 'island_quest' ? 'Island Quest' : mode === 'edu_arena' ? 'Edu Arena' : mode === 'district_quiz' ? 'District Quiz' : mode === 'competition' ? 'Competition' : 'Quiz',
                category: subject,
                subject: subject,
                grade: grade,
                language: medium,
                duration: params.duration || 30,
                district: district,
                scope: district ? 'district' : 'all_island',
                prizeDetails: {
                  firstPrize: '1st Prize Gold Medal & National Honor Certificate',
                  secondPrize: '2nd Prize Silver Medal',
                  thirdPrize: '3rd Prize Bronze Medal',
                  participationCertificate: 'Digital Merit Certificate of Participation',
                },
                questions: fallbackQuestions,
              };

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, competition: fallbackComp, source: 'fallback' }));
            } catch (err: any) {
              console.warn('Dev server Gemini auto-generate competition error:', err.message);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    },
    plugins: [
      react(),
      tailwindcss(),
      apiDevServerPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'hnc_competition_logo.png',
        ],
        manifest: {
          id: '/',
          name: 'HNC Competition & Student Study Hub',
          short_name: 'HNC EduHub',
          description: 'Sri Lanka’s Premier National Student Online Competition, Revision & Offline Study Platform.',
          theme_color: '#1e3a8a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          orientation: 'portrait-primary',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,json,pdf,xlsx,csv}'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6MB to cache study materials, revision sheets & docs
          runtimeCaching: [
            // 1. Downloaded Study Materials & Educational Documents (PDF, XLSX, CSV, Docs, JSON)
            {
              urlPattern: /\.(?:pdf|xlsx|xls|csv|docx|doc|txt|json)(?:\?.*)?$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'student-study-materials-cache',
                expiration: {
                  maxEntries: 150,
                  maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days offline retention
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 2. Cloud Storage Study Downloads (Firebase Cloud Storage documents & study PDFs)
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*study.*|^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/.*\/o\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'firebase-study-downloads-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 3. Saved Student Timetables & Offline Practice Competition Data
            {
              urlPattern: /\/api\/(?:generate-study-timetable|generate-sri-lankan-questions|auto-generate-competition).*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'student-offline-competitions-cache',
                networkTimeoutSeconds: 4,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 4. Google Fonts Stylesheets
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 15,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 5. Google Fonts Webfonts
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 6. Educational Graphics, Badges & Local Images
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)(?:\?.*)?$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'student-media-assets-cache',
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true, // Enables service worker in development / AI Studio preview
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    build: {
      target: 'esnext',
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('node_modules/firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

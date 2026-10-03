import { Competition, QuestionItem } from '../types';

export const fallbackQuestionBank: Record<string, QuestionItem[]> = {
  Mathematics: [
    {
      id: 'math-q1',
      type: 'multiple_choice',
      questionText: 'What is the sum of the interior angles of a regular hexagon?',
      options: ['540°', '720°', '900°', '1080°'],
      correctAnswer: '720°',
      marks: 10,
      order: 1,
    },
    {
      id: 'math-q2',
      type: 'true_false',
      questionText: 'The square root of 2 is an irrational number and cannot be expressed as a ratio of two integers.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: 5,
      order: 2,
    },
    {
      id: 'math-q3',
      type: 'short_answer',
      questionText: 'If 3x - 7 = 20, what is the numerical value of x?',
      correctAnswer: '9',
      marks: 10,
      order: 3,
    },
    {
      id: 'math-q4',
      type: 'picture_question',
      questionText: 'Study the geometric construction diagram below. What is the measure of angle theta in degrees?',
      imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60',
      options: ['45°', '60°', '90°', '120°'],
      correctAnswer: '60°',
      marks: 15,
      order: 4,
    },
  ],
  Science: [
    {
      id: 'sci-q1',
      type: 'multiple_choice',
      questionText: 'Which element has the atomic number 6 in the periodic table?',
      options: ['Oxygen', 'Nitrogen', 'Carbon', 'Boron'],
      correctAnswer: 'Carbon',
      marks: 10,
      order: 1,
    },
    {
      id: 'sci-q2',
      type: 'true_false',
      questionText: 'Light travels faster in a vacuum than through liquid water.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: 5,
      order: 2,
    },
    {
      id: 'sci-q3',
      type: 'short_answer',
      questionText: 'What is the standard chemical formula for water?',
      correctAnswer: 'H2O',
      marks: 10,
      order: 3,
    },
    {
      id: 'sci-q4',
      type: 'picture_question',
      questionText: 'Refer to the laboratory apparatus diagram. What chemical separation technique is demonstrated?',
      imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=60',
      options: ['Simple Distillation', 'Centrifugation', 'Paper Chromatography', 'Electrolysis'],
      correctAnswer: 'Simple Distillation',
      marks: 15,
      order: 4,
    },
  ],
  'General Knowledge': [
    {
      id: 'gk-q1',
      type: 'multiple_choice',
      questionText: 'Which planet is known as the "Red Planet" due to iron oxide on its surface?',
      options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
      correctAnswer: 'Mars',
      marks: 10,
      order: 1,
    },
    {
      id: 'gk-q2',
      type: 'true_false',
      questionText: 'Sri Lanka is located in the Indian Ocean, south of the Indian subcontinent.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: 5,
      order: 2,
    },
    {
      id: 'gk-q3',
      type: 'short_answer',
      questionText: 'In what year was the United Nations (UN) officially founded?',
      correctAnswer: '1945',
      marks: 10,
      order: 3,
    },
    {
      id: 'gk-q4',
      type: 'picture_question',
      questionText: 'Identify the iconic World Heritage geological formation shown in the photograph.',
      imageUrl: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?w=800&auto=format&fit=crop&q=60',
      options: ['Sigiriya Rock Fortress', 'Mount Fuji', 'Machu Picchu', 'Table Mountain'],
      correctAnswer: 'Sigiriya Rock Fortress',
      marks: 15,
      order: 4,
    },
  ],
  'IQ & Logic': [
    {
      id: 'iq-q1',
      type: 'multiple_choice',
      questionText: 'Which number logically completes the series: 3, 6, 12, 24, 48, ___ ?',
      options: ['64', '72', '96', '108'],
      correctAnswer: '96',
      marks: 10,
      order: 1,
    },
    {
      id: 'iq-q2',
      type: 'true_false',
      questionText: 'If all bloops are razzies and all razzies are lazzies, then all bloops are definitely lazzies.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: 5,
      order: 2,
    },
    {
      id: 'iq-q3',
      type: 'short_answer',
      questionText: 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How many cents does the ball cost?',
      correctAnswer: '5',
      marks: 10,
      order: 3,
    },
    {
      id: 'iq-q4',
      type: 'picture_question',
      questionText: 'Analyze the matrix pattern below. Which directional vector correctly fills the missing matrix cell?',
      imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=60',
      options: ['Top-Right 45°', 'Down-Left 135°', 'Direct North 90°', 'Direct South 270°'],
      correctAnswer: 'Top-Right 45°',
      marks: 15,
      order: 4,
    },
  ],
  English: [
    {
      id: 'eng-q1',
      type: 'multiple_choice',
      questionText: 'Which of the following phrases represents an oxymoron?',
      options: ['Deafening silence', 'Running quickly', 'Crystal clear water', 'Loud thunderclap'],
      correctAnswer: 'Deafening silence',
      marks: 10,
      order: 1,
    },
    {
      id: 'eng-q2',
      type: 'true_false',
      questionText: 'The word "ubiquitous" signifies present, appearing, or found everywhere simultaneously.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: 5,
      order: 2,
    },
    {
      id: 'eng-q3',
      type: 'short_answer',
      questionText: 'Identify the past participle form of the irregular verb "begin".',
      correctAnswer: 'begun',
      marks: 10,
      order: 3,
    },
    {
      id: 'eng-q4',
      type: 'picture_question',
      questionText: 'Examine this classical literary verse structure. Which poetic meter features five pairs of alternating unstressed and stressed syllables?',
      imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=60',
      options: ['Iambic Pentameter', 'Trochaic Tetrameter', 'Anapestic Hexameter', 'Dactylic Trimeter'],
      correctAnswer: 'Iambic Pentameter',
      marks: 15,
      order: 4,
    },
  ],
  Environment: [
    {
      id: 'env-q1',
      type: 'multiple_choice',
      questionText: 'Which natural gas contributes most significantly to the Earth\'s natural greenhouse atmospheric effect?',
      options: ['Water vapor (H2O)', 'Carbon dioxide (CO2)', 'Methane (CH4)', 'Nitrous oxide (N2O)'],
      correctAnswer: 'Water vapor (H2O)',
      marks: 10,
      order: 1,
    },
    {
      id: 'env-q2',
      type: 'true_false',
      questionText: 'Mangrove forests serve as essential bio-shields preventing coastal wave erosion and sequestering blue carbon.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: 5,
      order: 2,
    },
    {
      id: 'env-q3',
      type: 'short_answer',
      questionText: 'Name the landmark international treaty adopted in 2015 to combat global climate change.',
      correctAnswer: 'Paris Agreement',
      marks: 10,
      order: 3,
    },
    {
      id: 'env-q4',
      type: 'picture_question',
      questionText: 'Identify the clean energy generation method displayed in this coastal maritime installation.',
      imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop&q=60',
      options: ['Offshore Wind Turbine Array', 'Tidal Barrage Plant', 'Geothermal Tap Station', 'Ocean Wave Converter'],
      correctAnswer: 'Offshore Wind Turbine Array',
      marks: 15,
      order: 4,
    },
  ],
  Tamil: [
    {
      id: 'tam-q1',
      type: 'multiple_choice',
      questionText: 'திருக்குறள் எத்தனை அதிகாரங்களைக் கொண்டுள்ளது?',
      options: ['133', '130', '120', '140'],
      correctAnswer: '133',
      marks: 10,
      order: 1,
    },
    {
      id: 'tam-q2',
      type: 'true_false',
      questionText: 'தொல்காப்பியம் தமிழில் கிடைக்கப்பெற்ற மிகப்பழமையான இலக்கண நூலாகும்.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: 5,
      order: 2,
    },
    {
      id: 'tam-q3',
      type: 'short_answer',
      questionText: 'சிலப்பதிகாரத்தை இயற்றியவர் யார்?',
      correctAnswer: 'இளங்கோ அடிகள்',
      marks: 10,
      order: 3,
    },
    {
      id: 'tam-q4',
      type: 'multiple_choice',
      questionText: 'ஐம்பெருங் காப்பியங்களுள் பொருந்தாதது எது?',
      options: ['சிலப்பதிகாரம்', 'மணிமேகலை', 'சீவக சிந்தாமணி', 'நளவெண்பா'],
      correctAnswer: 'நளவெண்பா',
      marks: 10,
      order: 4,
    },
  ],
  'ICT & Computing': [
    {
      id: 'ict-q1',
      type: 'multiple_choice',
      questionText: 'Which protocol is standard for secure communication over computer networks and internet browsers?',
      options: ['HTTPS', 'FTP', 'SMTP', 'SNMP'],
      correctAnswer: 'HTTPS',
      marks: 10,
      order: 1,
    },
    {
      id: 'ict-q2',
      type: 'true_false',
      questionText: 'Binary representation uses only base-2 digits (0 and 1) for computer machine instructions.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: 5,
      order: 2,
    },
    {
      id: 'ict-q3',
      type: 'short_answer',
      questionText: 'What does CPU stand for in computer architecture?',
      correctAnswer: 'Central Processing Unit',
      marks: 10,
      order: 3,
    },
    {
      id: 'ict-q4',
      type: 'multiple_choice',
      questionText: 'Which data structure follows the Last-In-First-Out (LIFO) operational principle?',
      options: ['Stack', 'Queue', 'Array', 'Linked List'],
      correctAnswer: 'Stack',
      marks: 10,
      order: 4,
    },
  ],
};

export function getSampleQuestionsForCategory(category: string, count: number = 5): QuestionItem[] {
  const norm = (category || '').toLowerCase();
  let matchedBank = fallbackQuestionBank['General Knowledge'];

  if (norm.includes('math') || norm.includes('கணிதம்')) {
    matchedBank = fallbackQuestionBank.Mathematics;
  } else if (norm.includes('sci') || norm.includes('விஞ்ஞானம்') || norm.includes('stem')) {
    matchedBank = fallbackQuestionBank.Science;
  } else if (norm.includes('tamil') || norm.includes('தமிழ்')) {
    matchedBank = fallbackQuestionBank.Tamil;
  } else if (norm.includes('eng') || norm.includes('ஆங்கிலம்')) {
    matchedBank = fallbackQuestionBank.English;
  } else if (norm.includes('ict') || norm.includes('comput') || norm.includes('கணினி')) {
    matchedBank = fallbackQuestionBank['ICT & Computing'];
  } else if (norm.includes('iq') || norm.includes('logic') || norm.includes('நுண்ணறிவு')) {
    matchedBank = fallbackQuestionBank['IQ & Logic'];
  } else if (norm.includes('env') || norm.includes('சுற்றுச்சூழல்')) {
    matchedBank = fallbackQuestionBank.Environment;
  }

  const result: QuestionItem[] = [];
  const basePool = matchedBank && matchedBank.length > 0 ? matchedBank : fallbackQuestionBank.Mathematics;

  for (let i = 0; i < count; i++) {
    const template = basePool[i % basePool.length];
    const uniqueId = `q-${Date.now()}-${i + 1}`;
    result.push({
      ...template,
      id: uniqueId,
      order: i + 1,
      questionText: i < basePool.length ? template.questionText : `${template.questionText} (Question Set #${Math.floor(i / basePool.length) + 1})`,
      marks: template.marks || 5,
    });
  }

  return result;
}

export function getCompetitionQuestions(comp: Competition): QuestionItem[] {
  if (comp && Array.isArray(comp.questions) && comp.questions.length > 0) {
    return comp.questions;
  }
  return comp?.questions || [];
}

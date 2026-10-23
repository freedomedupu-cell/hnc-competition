/**
 * Sri Lankan National Institute of Education (NIE) Curriculum Fallback Engine
 * Provides authentic, localized curriculum questions when AI upstream models experience high demand (503).
 */

export interface FallbackParams {
  mode?: string;
  subject?: string;
  grade?: string;
  medium?: 'Tamil' | 'English' | 'Sinhala' | string;
  district?: string;
  questionCount?: number;
  optionsCount?: number;
  duration?: number;
  difficulty?: string;
  customTopic?: string;
}

interface QuestionTemplate {
  subjectKey: string;
  gradeBand: 'primary' | 'secondary' | 'advanced';
  questionTa: string;
  questionEn: string;
  questionSi: string;
  optionsTa: string[];
  optionsEn: string[];
  optionsSi: string[];
  correctAnswerTa: string;
  correctAnswerEn: string;
  correctAnswerSi: string;
  explanationTa: string;
  explanationEn: string;
  explanationSi: string;
  outcomeTa: string;
  outcomeEn: string;
  outcomeSi: string;
}

const QUESTION_BANK: QuestionTemplate[] = [
  // Mathematics - Primary (3 Options rule: A, B, C)
  {
    subjectKey: 'math',
    gradeBand: 'primary',
    questionTa: '54 உடன் 27 ஐக் கூட்டும் போது கிடைக்கும் பெறுமானம் யாது?',
    questionEn: 'What is the sum of 54 and 27?',
    questionSi: '54 සහ 27 එකතු කළ විට ලැබෙන අගය කුමක්ද?',
    optionsTa: ['81', '71', '91'],
    optionsEn: ['81', '71', '91'],
    optionsSi: ['81', '71', '91'],
    correctAnswerTa: '81',
    correctAnswerEn: '81',
    correctAnswerSi: '81',
    explanationTa: '54 + 27 = 81 (4 + 7 = 11, 1 மீதி; 5 + 2 + 1 = 8).',
    explanationEn: '54 + 27 = 81 (4 + 7 = 11, carry 1; 5 + 2 + 1 = 8).',
    explanationSi: '54 + 27 = 81 (4 + 7 = 11, 1ක් ඉතිරි; 5 + 2 + 1 = 8).',
    outcomeTa: 'இரு இலக்க எண்களின் கூட்டல் தேர்ச்சி',
    outcomeEn: 'Addition of two-digit numbers competency',
    outcomeSi: 'දෙඅංක සංඛ්‍යා එකතු කිරීමේ නිපුණතාව',
  },
  {
    subjectKey: 'math',
    gradeBand: 'primary',
    questionTa: 'ஒரு செவ்வகத்திற்கு எத்தனை பக்கங்கள் உள்ளன?',
    questionEn: 'How many sides does a rectangle have?',
    questionSi: 'සෘජුකෝණාස්‍රයකට පැති කීයක් තිබේද?',
    optionsTa: ['4 பக்கங்கள்', '3 பக்கங்கள்', '5 பக்கங்கள்'],
    optionsEn: ['4 sides', '3 sides', '5 sides'],
    optionsSi: ['පැති 4', 'පැති 3', 'පැති 5'],
    correctAnswerTa: '4 பக்கங்கள்',
    correctAnswerEn: '4 sides',
    correctAnswerSi: 'පැති 4',
    explanationTa: 'செவ்வகம் 4 பக்கங்களையும் 4 செங்கோணங்களையும் கொண்ட இருபரிமாண உருவமாகும்.',
    explanationEn: 'A rectangle is a 2D shape with 4 sides and 4 right angles.',
    explanationSi: 'සෘජුකෝණාස්‍රයක් යනු පැති 4ක් සහ සෘජුකෝණ 4ක් ඇති ද්විමාන හැඩයකි.',
    outcomeTa: 'இருபரிமாண தள உருவங்களை அடையாளம் காணல்',
    outcomeEn: 'Identification of 2D geometrical shapes',
    outcomeSi: 'ද්විමාන හැඩතල හඳුනා ගැනීම',
  },
  {
    subjectKey: 'math',
    gradeBand: 'primary',
    questionTa: 'ரூபா 100 தாள் ஒன்றிற்கு சமனான ரூபா 20 நாணயக் குற்றிகள் எத்தனை?',
    questionEn: 'How many Rs. 20 coins make up a Rs. 100 note in Sri Lankan currency?',
    questionSi: 'රුපියල් 100 ක නෝට්ටුවකට සමාන රුපියල් 20 කාසි කීයක් තිබේද?',
    optionsTa: ['5 நாணயங்கள்', '4 நாணயங்கள்', '6 நாணயங்கள்'],
    optionsEn: ['5 coins', '4 coins', '6 coins'],
    optionsSi: ['කාසි 5', 'කාසි 4', 'කාසි 6'],
    correctAnswerTa: '5 நாணயங்கள்',
    correctAnswerEn: '5 coins',
    correctAnswerSi: 'කාසි 5',
    explanationTa: '100 ÷ 20 = 5 நாணயக் குற்றிகள் ஆகும்.',
    explanationEn: '100 divided by 20 equals 5 coins of Rs. 20.',
    explanationSi: '100 බෙදීම 20 සමාන වන්නේ රු. 20 කාසි 5කටය.',
    outcomeTa: 'இலங்கை நாணயப் பயன்பாடு மற்றும் கணிப்புத் திறன்',
    outcomeEn: 'Sri Lankan currency counting and basic division',
    outcomeSi: 'ශ්‍රී ලංකා මුදල් භාවිතය සහ ගණනය කිරීම්',
  },

  // Mathematics - Secondary (4 Options rule: A, B, C, D)
  {
    subjectKey: 'math',
    gradeBand: 'secondary',
    questionTa: '2x + 7 = 19 என்ற சமன்பாட்டைத் தீர்க்கும் போது x இன் பெறுமானம் யாது?',
    questionEn: 'Solve the equation for x: 2x + 7 = 19',
    questionSi: '2x + 7 = 19 සමීකරණය විසඳූ විට x හි අගය කුමක්ද?',
    optionsTa: ['6', '5', '7', '12'],
    optionsEn: ['6', '5', '7', '12'],
    optionsSi: ['6', '5', '7', '12'],
    correctAnswerTa: '6',
    correctAnswerEn: '6',
    correctAnswerSi: '6',
    explanationTa: '2x = 19 - 7 = 12 => x = 12 / 2 = 6.',
    explanationEn: '2x = 19 - 7 = 12 => x = 12 / 2 = 6.',
    explanationSi: '2x = 19 - 7 = 12 => x = 12 / 2 = 6.',
    outcomeTa: 'ஓரிலக்க எளிய ஒருங்கமை சமன்பாடுகளைத் தீர்த்தல் (NIE தரம் 9-11)',
    outcomeEn: 'Solving linear single-variable algebraic equations',
    outcomeSi: 'සරල රේඛීය සමීකරණ විසඳීම',
  },
  {
    subjectKey: 'math',
    gradeBand: 'secondary',
    questionTa: 'ஆரை 7 cm ஆகவுள்ள வட்டமொன்றின் பரப்பளவு யாது? (π = 22/7 எனக்கொள்க)',
    questionEn: 'What is the area of a circle with a radius of 7 cm? (Use π = 22/7)',
    questionSi: 'අරය 7 cm වන වෘත්තයක වර්ගඵලය කුමක්ද? (π = 22/7 ලෙස ගන්න)',
    optionsTa: ['154 cm²', '44 cm²', '88 cm²', '308 cm²'],
    optionsEn: ['154 cm²', '44 cm²', '88 cm²', '308 cm²'],
    optionsSi: ['154 cm²', '44 cm²', '88 cm²', '308 cm²'],
    correctAnswerTa: '154 cm²',
    correctAnswerEn: '154 cm²',
    correctAnswerSi: '154 cm²',
    explanationTa: 'வட்டத்தின் பரப்பளவு = πr² = (22/7) × 7 × 7 = 154 cm².',
    explanationEn: 'Area of circle = πr² = (22/7) × 7 × 7 = 154 cm².',
    explanationSi: 'වෘත්තයේ වර්ගඵලය = πr² = (22/7) × 7 × 7 = 154 cm².',
    outcomeTa: 'சுற்றளவும் பரப்பளவும் தொடர்பான கணிதத் தேர்ச்சி',
    outcomeEn: 'Perimeter and circular area calculation competency',
    outcomeSi: 'පරිමිතිය සහ වර්ගඵලය ගණනය කිරීම',
  },
  {
    subjectKey: 'math',
    gradeBand: 'secondary',
    questionTa: 'செங்கோண முக்கோணியொன்றின் செம்பக்கம் 10 cm, ஓர் பக்கம் 6 cm எனின், மற்றைய பக்கத்தின் நீளம் யாது?',
    questionEn: 'In a right-angled triangle, if the hypotenuse is 10 cm and one side is 6 cm, what is the other side?',
    questionSi: 'සෘජුකෝණී ත්‍රිකෝණයක කර්ණය 10 cm සහ එක් පැත්තක් 6 cm නම්, අනෙක් පැත්තේ දිග කුමක්ද?',
    optionsTa: ['8 cm', '7 cm', '9 cm', '4 cm'],
    optionsEn: ['8 cm', '7 cm', '9 cm', '4 cm'],
    optionsSi: ['8 cm', '7 cm', '9 cm', '4 cm'],
    correctAnswerTa: '8 cm',
    correctAnswerEn: '8 cm',
    correctAnswerSi: '8 cm',
    explanationTa: 'பைதகரஸின் தேற்றப்படி: a² + b² = c² => 6² + b² = 10² => 36 + b² = 100 => b² = 64 => b = 8 cm.',
    explanationEn: 'By Pythagoras theorem: 6² + b² = 10² => 36 + b² = 100 => b² = 64 => b = 8 cm.',
    explanationSi: 'පයිතගරස් ප්‍රමේයයට අනුව: 6² + b² = 10² => 36 + b² = 100 => b² = 64 => b = 8 cm.',
    outcomeTa: 'பைதகரஸ் தொடர்பு மற்றும் முக்கோணவியல் பயன்பாடுகள்',
    outcomeEn: 'Application of Pythagoras Theorem',
    outcomeSi: 'පයිතගරස් ප්‍රමේයය භාවිතය',
  },
  {
    subjectKey: 'math',
    gradeBand: 'secondary',
    questionTa: 'ஒரு நாணயமும் ஒரு தாயக்கட்டையும் ஒரே நேரத்தில் உருட்டப்படும் போது, நாணயத்தில் தலை (Head) மற்றும் பகடையில் 6 கிடைப்பதற்கான நிகழ்தகவு யாது?',
    questionEn: 'When a coin is tossed and a fair die is rolled simultaneously, what is the probability of getting a Head and a 6?',
    questionSi: 'කාසියක් සහ දාදු කැටයක් එකවර විසි කළ විට, කාසියේ සිරස (Head) සහ දාදු කැටයේ 6 ලැබීමේ සම්භාවිතාව කුමක්ද?',
    optionsTa: ['1/12', '1/6', '1/8', '1/4'],
    optionsEn: ['1/12', '1/6', '1/8', '1/4'],
    optionsSi: ['1/12', '1/6', '1/8', '1/4'],
    correctAnswerTa: '1/12',
    correctAnswerEn: '1/12',
    correctAnswerSi: '1/12',
    explanationTa: 'P(Head) = 1/2, P(6) = 1/6. இரண்டும் சாரா நிகழ்ச்சிகள் என்பதால்: P(Head ∩ 6) = (1/2) × (1/6) = 1/12.',
    explanationEn: 'P(Head) = 1/2, P(6) = 1/6. Independent events: (1/2) × (1/6) = 1/12.',
    explanationSi: 'P(Head) = 1/2, P(6) = 1/6. ස්වායක්ත සිදුවීම් බැවින්: (1/2) × (1/6) = 1/12.',
    outcomeTa: 'நிகழ்தகவுக் கோட்பாடும் சாரா நிகழ்ச்சிகளின் கணிப்பும் (O/L தரம் 11)',
    outcomeEn: 'Probability and independent compound events (GCE O/L)',
    outcomeSi: 'සම්භාවිතාව සහ ස්වායක්ත සිදුවීම්',
  },
  {
    subjectKey: 'math',
    gradeBand: 'secondary',
    questionTa: 'ரூபா 50,000 இற்கு 12% ஆண்டு எளிய வட்டி வீதத்தில் 2 வருடங்களுக்குக் கிடைக்கும் மொத்த வட்டிப் பணம் எவ்வளவு?',
    questionEn: 'What is the total simple interest on Rs. 50,000 at 12% annual interest for 2 years?',
    questionSi: 'රු. 50,000 සඳහා වාර්ෂික 12% සුළු පොලී අනුපාතයකට වසර 2ක් සඳහා ලැබෙන මුළු පොලිය කොපමණද?',
    optionsTa: ['LKR 12,000', 'LKR 6,000', 'LKR 10,000', 'LKR 14,000'],
    optionsEn: ['LKR 12,000', 'LKR 6,000', 'LKR 10,000', 'LKR 14,000'],
    optionsSi: ['රු. 12,000', 'රු. 6,000', 'රු. 10,000', 'රු. 14,000'],
    correctAnswerTa: 'LKR 12,000',
    correctAnswerEn: 'LKR 12,000',
    correctAnswerSi: 'රු. 12,000',
    explanationTa: 'வட்டி (I) = (P × R × T) / 100 = (50,000 × 12 × 2) / 100 = 12,000 ரூபா.',
    explanationEn: 'Simple Interest = (P × R × T) / 100 = (50,000 × 12 × 2) / 100 = LKR 12,000.',
    explanationSi: 'සුළු පොලිය = (P × R × T) / 100 = (50,000 × 12 × 2) / 100 = රු. 12,000.',
    outcomeTa: 'நிதிசார் கணிதம் - வட்டி கணிப்பு மற்றும் வணிகக் கணக்குகள்',
    outcomeEn: 'Commercial mathematics - interest rate calculations',
    outcomeSi: 'වාණිජ ගණිතය - පොලී ගණනය කිරීම්',
  },

  // Science - Secondary (4 Options rule)
  {
    subjectKey: 'science',
    gradeBand: 'secondary',
    questionTa: 'தாவரங்களில் ஒளித்தொகுப்பு நடைபெறும் முக்கிய கல நுண்ணுறுப்பு எது?',
    questionEn: 'Which cell organelle is the primary site of photosynthesis in plant cells?',
    questionSi: 'ශාක සෛලවල ප්‍රභාසංස්ලේෂණය සිදුවන ප්‍රධාන සෛල ඉන්ද්‍රියිකාව කුමක්ද?',
    optionsTa: ['பச்சையவுருமணி (Chloroplast)', 'இழைமணி (Mitochondria)', 'ரைபோசோம் (Ribosome)', 'கொல்கி உடலம் (Golgi apparatus)'],
    optionsEn: ['Chloroplast', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
    optionsSi: ['හරිතලවය (Chloroplast)', 'මයිටොකොන්ඩ්‍රියාව', 'රයිබොසෝම', 'ගොල්ගි දේහ'],
    correctAnswerTa: 'பச்சையவுருமணி (Chloroplast)',
    correctAnswerEn: 'Chloroplast',
    correctAnswerSi: 'හරිතලවය (Chloroplast)',
    explanationTa: 'பச்சையவுருவத்தில் காணப்படும் பச்சையம் சூரிய ஒளியை உறிஞ்சி ஒளித்தொகுப்புக்கு உதவுகிறது.',
    explanationEn: 'Chloroplasts contain chlorophyll which absorbs sunlight for photosynthesis.',
    explanationSi: 'හරිතලව තුළ ඇති හරිතප්‍රද මගින් සූර්යාලෝකය අවශෝෂණය කර ප්‍රභාසංස්ලේෂණය සිදු කරයි.',
    outcomeTa: 'கலக் கட்டமைப்பு மற்றும் தாவர உடற்றொழிலியல் (NIE தரம் 10)',
    outcomeEn: 'Plant cellular biology and physiological functions',
    outcomeSi: 'ශාක සෛල ජීව විද්‍යාව',
  },
  {
    subjectKey: 'science',
    gradeBand: 'secondary',
    questionTa: 'மனித உடலின் குருதிச் சுற்றோட்டத் தொகுதியில் ஒக்சிசன் செறிந்த குருதியை உடலின் அனைத்துப் பகுதிகளுக்கும் கொண்டுசெல்லும் பிரதான நாடி எது?',
    questionEn: 'Which is the main artery that carries oxygenated blood from the heart to all parts of the body?',
    questionSi: 'හෘදයේ සිට ශරීරයේ සියලුම කොටස් වලට ඔක්සිජන් සහිත රුධිරය ගෙන යන ප්‍රධාන ධමනිය කුමක්ද?',
    optionsTa: ['பெருநாடி (Aorta)', 'நுரையீரல் நாடி (Pulmonary artery)', 'கரோட்டிட் நாடி (Carotid artery)', 'சிறுநீரக நாடி (Renal artery)'],
    optionsEn: ['Aorta', 'Pulmonary artery', 'Carotid artery', 'Renal artery'],
    optionsSi: ['මහා ධමනිය (Aorta)', 'පුප්ඵුසීය ධමනිය', 'කැරොටයිඩ් ධමනිය', 'වෘක්කීය ධමනිය'],
    correctAnswerTa: 'பெருநாடி (Aorta)',
    correctAnswerEn: 'Aorta',
    correctAnswerSi: 'මහා ධමනිය (Aorta)',
    explanationTa: 'இடது இதயவறையிலிருந்து வெளியேறும் பெருநாடி (Aorta) முழு உடலுக்கும் ஒக்சிசன் செறிந்த குருதியை விநியோகிக்கிறது.',
    explanationEn: 'The aorta is the largest artery that pumps oxygenated blood from the left ventricle to systemic circulation.',
    explanationSi: 'වම් කෝෂිකාවෙන් ආරම්භ වන මහා ධමනිය ශරීරයේ සියලුම ප්‍රදේශවලට ඔක්සිජන් සහිත රුධිරය බෙදාහරියි.',
    outcomeTa: 'மனித உடலின் குருதிச் சுற்றோட்டத் தொகுதி (தரம் 11 விஞ்ஞானம்)',
    outcomeEn: 'Human circulatory and cardiovascular system',
    outcomeSi: 'මානව රුධිර සංසරණ පද්ධතිය',
  },
  {
    subjectKey: 'science',
    gradeBand: 'secondary',
    questionTa: 'நியூட்டனின் இரண்டாம் இயக்க விதியைக் குறிக்கும் சரியான கணிதத் தொடர்பு எது?',
    questionEn: 'Which equation correctly represents Newton’s Second Law of Motion?',
    questionSi: 'නිව්ටන්ගේ දෙවන චලිත නියමය නිවැරදිව දක්වන සමීකරණය කුමක්ද?',
    optionsTa: ['F = ma', 'E = mc²', 'v = u + at', 'P = mv'],
    optionsEn: ['F = ma', 'E = mc²', 'v = u + at', 'P = mv'],
    optionsSi: ['F = ma', 'E = mc²', 'v = u + at', 'P = mv'],
    correctAnswerTa: 'F = ma',
    correctAnswerEn: 'F = ma',
    correctAnswerSi: 'F = ma',
    explanationTa: 'விசை (F) = திணிவு (m) × ஆர்முடுகல் (a) என்பது நியூட்டனின் இரண்டாம் இயக்க விதியாகும்.',
    explanationEn: 'Force equals mass times acceleration (F = ma) according to Newton’s second law.',
    explanationSi: 'බලය (F) = ස්කන්ධය (m) × ත්වරණය (a) යනු නිව්ටන්ගේ දෙවන චලිත නියමයයි.',
    outcomeTa: 'இயக்க விதிகள் மற்றும் விசையின் கணிப்புத் தேர்ச்சி',
    outcomeEn: 'Laws of motion and force calculations',
    outcomeSi: 'චලිත නියම සහ බලය ගණනය කිරීම',
  },

  // Tamil Language & Literature
  {
    subjectKey: 'tamil',
    gradeBand: 'secondary',
    questionTa: 'திருக்குறளில் உள்ள மொத்த அதிகாரங்கள் மற்றும் குறட்பாக்களின் எண்ணிக்கை முறையே யாவை?',
    questionEn: 'How many chapters (Adhikaram) and couplets (Kural) are in Thirukkural?',
    questionSi: 'තිරුක්කුරල් හි ඇති මුළු පරිච්ඡේද සහ ගාථා සංඛ්‍යාව පිළිවෙලින් කොපමණද?',
    optionsTa: ['133 அதிகாரங்கள், 1330 குறள்கள்', '130 அதிகாரங்கள், 1300 குறள்கள்', '120 அதிகாரங்கள், 1200 குறள்கள்', '150 அதிகாரங்கள், 1500 குறள்கள்'],
    optionsEn: ['133 Chapters, 1330 Couplets', '130 Chapters, 1300 Couplets', '120 Chapters, 1200 Couplets', '150 Chapters, 1500 Couplets'],
    optionsSi: ['පරිච්ඡේද 133, ගාථා 1330', 'පරිච්ඡේද 130, ගාථා 1300', 'පරිච්ඡේද 120, ගාථා 1200', 'පරිච්ඡේද 150, ගාථා 1500'],
    correctAnswerTa: '133 அதிகாரங்கள், 1330 குறள்கள்',
    correctAnswerEn: '133 Chapters, 1330 Couplets',
    correctAnswerSi: 'පරිච්ඡේද 133, ගාථා 1330',
    explanationTa: 'திருக்குறள் அறத்துப்பால், பொருட்பால், காமத்துப்பால் என முப்பால்களையும் 133 அதிகாரங்களையும் 1330 குறள்களையும் கொண்டுள்ளது.',
    explanationEn: 'Thirukkural has 133 chapters with 10 couplets each, totaling 1,330 couplets.',
    explanationSi: 'තිරුක්කුරල් හි එක් පරිච්ඡේදයකට ගාථා 10 බැගින් පරිච්ඡේද 133ක ගාථා 1330ක් අඩංගු වේ.',
    outcomeTa: 'செம்மொழி இலக்கிய மரபும் திருக்குறள் அமைப்பும்',
    outcomeEn: 'Classical Tamil literature and Thirukkural structure',
    outcomeSi: 'දෙමළ සාහිත්‍යය සහ තිරුක්කුරල් ව්‍යුහය',
  },
  {
    subjectKey: 'tamil',
    gradeBand: 'secondary',
    questionTa: '"கற்க கசடறக் கற்பவை கற்றபின் நிற்க அதற்குத் தக" - இக்குறளில் பயின்று வந்துள்ள மோனை நயம் யாது?',
    questionEn: 'Identify the poetic alliteration (Monai) in the Thirukkural couplet "Karka Kasadara..."',
    questionSi: '"කර්ක කසඩර..." තිරුක්කුරල් පදයේ ඇති කාව්‍යමය ලක්ෂණය කුමක්ද?',
    optionsTa: ['முற்று மோனை', 'இணை மோனை', 'பொழிப்பு மோனை', 'கீழ்க் கதுவாய் மோனை'],
    optionsEn: ['Muttru Monai (Full alliteration)', 'Inai Monai', 'Pozhippu Monai', 'Keezhkkathuvai Monai'],
    optionsSi: ['සම්පූර්ණ අනුප්‍රාසය', 'යුගල අනුප්‍රාසය', 'පොලිප්පු අනුප්‍රාසය', 'කීල්ක්කදුවායි අනුප්‍රාසය'],
    correctAnswerTa: 'முற்று மோனை',
    correctAnswerEn: 'Muttru Monai (Full alliteration)',
    correctAnswerSi: 'සම්පූර්ණ අනුප්‍රාසය',
    explanationTa: 'அடியில் உள்ள நான்கு சீர்களினதும் முதல் எழுத்துக்கள் (க, க, க, நி) ஒன்றி வருவதை ஆராய்கையில் முதற் மூன்று சீர்களில் "க" ஒத்து வந்துள்ளது.',
    explanationEn: 'The initial letters in consecutive metrical feet correspond to classical Tamil prosody alliteration.',
    explanationSi: 'දෙමළ ඡන්දස් ශාස්ත්‍රයට අනුව අනුප්‍රාසය හඳුනා ගැනීම.',
    outcomeTa: 'செய்யுள் யாப்பிலக்கணம் மற்றும் தொடை நயங்கள் (O/L தமிழ்)',
    outcomeEn: 'Tamil prosody, poetics, and stylistic devices',
    outcomeSi: 'දෙමළ කාව්‍ය ශාස්ත්‍රය',
  },

  // Sri Lanka History & Heritage (Island Quest & District Focus)
  {
    subjectKey: 'history',
    gradeBand: 'secondary',
    questionTa: 'இலங்கையில் மகா பராக்கிரமபாகு மன்னனால் நிர்மாணிக்கப்பட்ட பிரசித்தி பெற்ற மாபெரும் குளம் எது?',
    questionEn: 'Which famous massive reservoir was constructed by King Parakramabahu I in Polonnaruwa?',
    questionSi: 'පළමුවන පරාක්‍රමබාහු රජු විසින් පොළොන්නරුවේ ඉදිකරන ලද සුප්‍රකට දැවැන්ත වැව කුමක්ද?',
    optionsTa: ['பராக்கிரம சமுத்திரம் (Parakrama Samudra)', 'மின்னேரியா குளம்', 'கலாவாவி (Kala Wewa)', 'திஸாவாவி (Tissa Wewa)'],
    optionsEn: ['Parakrama Samudra', 'Minneriya Wewa', 'Kala Wewa', 'Tissa Wewa'],
    optionsSi: ['පරාක්‍රම සමුද්‍රය', 'මින්නේරිය වැව', 'කලා වැව', 'තිස්ස වැව'],
    correctAnswerTa: 'பராக்கிரம சமுத்திரம் (Parakrama Samudra)',
    correctAnswerEn: 'Parakrama Samudra',
    correctAnswerSi: 'පරාක්‍රම සමුද්‍රය',
    explanationTa: '"வானிலிருந்து விழும் ஒரு துளி நீரேனும் கடலைச் சென்றடையக் கூடாது" என்ற கோட்பாட்டுடன் பராக்கிரம சமுத்திரம் கட்டப்பட்டது.',
    explanationEn: 'King Parakramabahu built Parakrama Samudra declaring that not a drop of rain water should flow into the sea without being used.',
    explanationSi: 'අහසින් වැටෙන එකදු දිය බිඳක්වත් මිනිසාගේ ප්‍රයෝජනයට නොගෙන මුහුදට ගලා යාමට ඉඩ නොදිය යුතුය යන තේමාවෙන් පරාක්‍රම සමුද්‍රය ඉදිකරන ලදී.',
    outcomeTa: 'இலங்கையின் பண்டைய பாசன நாகரிகமும் நீரியல் தொழில்நுட்பமும்',
    outcomeEn: 'Ancient hydraulic civilization of Sri Lanka',
    outcomeSi: 'ශ්‍රී ලංකාවේ පුරාණ වාරි ශිෂ්ටාචාරය',
  },
  {
    subjectKey: 'history',
    gradeBand: 'secondary',
    questionTa: 'இலங்கையின் 25 நிர்வாக மாவட்டங்களில் வடக்கு மாகாணத்தில் அமைந்துள்ள மாவட்டங்களின் எண்ணிக்கை யாது?',
    questionEn: 'How many administrative districts comprise the Northern Province of Sri Lanka?',
    questionSi: 'ශ්‍රී ලංකාවේ උතුරු පළාතට අයත් පරිපාලන දිස්ත්‍රික්ක ගණන කීයද?',
    optionsTa: ['5 மாவட்டங்கள் (யாழ்ப்பாணம், கிளிநொச்சி, மன்னார், வவுனியா, முல்லைத்தீவு)', '4 மாவட்டங்கள்', '6 மாவட்டங்கள்', '3 மாவட்டங்கள்'],
    optionsEn: ['5 Districts (Jaffna, Kilinochchi, Mannar, Vavuniya, Mullaitivu)', '4 Districts', '6 Districts', '3 Districts'],
    optionsSi: ['දිස්ත්‍රික්ක 5 (යාපනය, කිලිනොච්චිය, මන්නාරම, වවුනියාව, මුලතිව්)', 'දිස්ත්‍රික්ක 4', 'දිස්ත්‍රික්ක 6', 'දිස්ත්‍රික්ක 3'],
    correctAnswerTa: '5 மாவட்டங்கள் (யாழ்ப்பாணம், கிளிநொச்சி, மன்னார், வவுனியா, முல்லைத்தீவு)',
    correctAnswerEn: '5 Districts (Jaffna, Kilinochchi, Mannar, Vavuniya, Mullaitivu)',
    correctAnswerSi: 'දිස්ත්‍රික්ක 5 (යාපනය, කිලිනොච්චිය, මන්නාරම, වවුනියාව, මුලතිව්)',
    explanationTa: 'வட மாகாணம் யாழ்ப்பாணம், கிளிநொச்சி, மன்னார், வவுனியா, முல்லைத்தீவு ஆகிய ஐந்து மாவட்டங்களைக் கொண்டுள்ளது.',
    explanationEn: 'The Northern Province contains 5 districts: Jaffna, Kilinochchi, Mannar, Vavuniya, and Mullaitivu.',
    explanationSi: 'උතුරු පළාත යාපනය, කිලිනොච්චිය, මන්නාරම, වවුනියාව සහ මුලතිව් යන දිස්ත්‍රික්ක 5 කින් සමන්විත වේ.',
    outcomeTa: 'இலங்கையின் மாகாண மற்றும் மாவட்ட நிர்வாகக் கட்டமைப்பு',
    outcomeEn: 'Provincial and district administrative geography of Sri Lanka',
    outcomeSi: 'ශ්‍රී ලංකාවේ පරිපාලන භූගෝල විද්‍යාව',
  },

  // Information & Communication Technology (ICT)
  {
    subjectKey: 'ict',
    gradeBand: 'secondary',
    questionTa: 'கணினியின் மத்திய முறைவழிப் பிரிவின் (CPU) பிரதான மூன்று உட்கூறுகள் எவை?',
    questionEn: 'What are the three main components of a computer’s Central Processing Unit (CPU)?',
    questionSi: 'පරිගණකයක මධ්‍ය සැකසුම් ඒකකයේ (CPU) ප්‍රධාන කොටස් 3 කුමක්ද?',
    optionsTa: [
      'கட்டுப்பாட்டுப் பிரிவு (CU), கணித ஏரணப் பிரிவு (ALU), பதிவகங்கள் (Registers)',
      'RAM, ROM, Hard Disk',
      'Input, Output, Storage',
      'Monitor, Keyboard, Mouse'
    ],
    optionsEn: [
      'Control Unit (CU), Arithmetic Logic Unit (ALU), Registers',
      'RAM, ROM, Hard Disk',
      'Input, Output, Storage',
      'Monitor, Keyboard, Mouse'
    ],
    optionsSi: [
      'පාලන ඒකකය (CU), ගණිතමය හා තාර්කික ඒකකය (ALU), රෙජිස්තර (Registers)',
      'RAM, ROM, දෘඪ තැටිය',
      'ආදාන, ප්‍රතිදාන, ආචයන',
      'මොනිටරය, යතුරුපුවරුව, මූසිකය'
    ],
    correctAnswerTa: 'கட்டுப்பாட்டுப் பிரிவு (CU), கணித ஏரணப் பிரிவு (ALU), பதிவகங்கள் (Registers)',
    correctAnswerEn: 'Control Unit (CU), Arithmetic Logic Unit (ALU), Registers',
    correctAnswerSi: 'පාලන ඒකකය (CU), ගණිතමය හා තාර්කික ඒකකය (ALU), රෙජිස්තර (Registers)',
    explanationTa: 'CPU ஆனது CU, ALU மற்றும் அதிவேக தற்காலிக நினைவகமான பதிவகங்கள் (Registers) ஆகியவற்றைக் கொண்டுள்ளது.',
    explanationEn: 'The CPU consists of the Control Unit, Arithmetic Logic Unit, and internal Registers.',
    explanationSi: 'CPU හි ප්‍රධාන කොටස් වන්නේ පාලන ඒකකය, ගණිත හා තාර්කික ඒකකය සහ අභ්‍යන්තර රෙජිස්ටරයි.',
    outcomeTa: 'கணினி வன்பொருள் மற்றும் கட்டமைப்பு (தரம் 10-11 ICT)',
    outcomeEn: 'Computer hardware architecture and processing cycle',
    outcomeSi: 'පරිගණක දෘඩාංග සහ ගෘහ නිර්මාණ ශිල්පය',
  },
  {
    subjectKey: 'ict',
    gradeBand: 'secondary',
    questionTa: 'தசம எண் 13 இற்கு சமனான இரும எண் (Binary representation) யாது?',
    questionEn: 'What is the binary representation of the decimal number 13?',
    questionSi: 'දශම 13 සංඛ්‍යාවට සමාන ද්විමය (Binary) අගය කුමක්ද?',
    optionsTa: ['1101', '1011', '1110', '1001'],
    optionsEn: ['1101', '1011', '1110', '1001'],
    optionsSi: ['1101', '1011', '1110', '1001'],
    correctAnswerTa: '1101',
    correctAnswerEn: '1101',
    correctAnswerSi: '1101',
    explanationTa: '13 = 8 + 4 + 0 + 1 = 1×2³ + 1×2² + 0×2¹ + 1×2⁰ = 1101₂.',
    explanationEn: '13 in binary = 8 + 4 + 0 + 1 = 1101₂.',
    explanationSi: '13 ද්විමය ක්‍රමයෙන් = 8 + 4 + 0 + 1 = 1101₂.',
    outcomeTa: 'எண் முறைமைகளும் இரும எண்கணிதமும் (GCE O/L & A/L ICT)',
    outcomeEn: 'Number systems and binary conversions',
    outcomeSi: 'සංඛ්‍යා පද්ධති සහ ද්විමය පරිවර්තනය',
  },
];

export function generateSriLankanCurriculumCompetition(params: FallbackParams) {
  const isPrimary = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Scholarship'].some((g) =>
    (params.grade || '').toLowerCase().includes(g.toLowerCase())
  );
  const targetGradeBand = isPrimary ? 'primary' : 'secondary';
  const medium = (params.medium || 'Tamil') as 'Tamil' | 'English' | 'Sinhala';
  const targetCount = Math.max(3, Math.min(20, params.questionCount || 5));
  const district = params.district || '';
  const mode = params.mode || 'quiz';
  const subject = params.subject || 'Mathematics';
  const duration = params.duration || (targetCount * 3);

  // Normalize subject key
  const sLower = subject.toLowerCase();
  let subKey = 'math';
  if (sLower.includes('விஞ்ஞானம்') || sLower.includes('science')) subKey = 'science';
  else if (sLower.includes('தமிழ்') || sLower.includes('tamil')) subKey = 'tamil';
  else if (sLower.includes('வரலாறு') || sLower.includes('history') || sLower.includes('quest') || sLower.includes('heritage')) subKey = 'history';
  else if (sLower.includes('ict') || sLower.includes('தொழில்நுட்பம்') || sLower.includes('computer')) subKey = 'ict';

  // Filter bank by subject or fallback to all relevant
  let matched = QUESTION_BANK.filter((q) => q.subjectKey === subKey && (q.gradeBand === targetGradeBand || !isPrimary));
  if (matched.length === 0) {
    matched = QUESTION_BANK.filter((q) => !isPrimary || q.gradeBand === 'primary');
  }

  // Generate questions list
  const questions: any[] = [];
  for (let i = 0; i < targetCount; i++) {
    const template = matched[i % matched.length];
    const qId = `q_nie_${Date.now()}_${i + 1}`;

    let qText = template.questionTa;
    let opts = template.optionsTa;
    let correct = template.correctAnswerTa;
    let expl = template.explanationTa;
    let outcome = template.outcomeTa;

    if (medium === 'English') {
      qText = template.questionEn;
      opts = template.optionsEn;
      correct = template.correctAnswerEn;
      expl = template.explanationEn;
      outcome = template.outcomeEn;
    } else if (medium === 'Sinhala') {
      qText = template.questionSi;
      opts = template.optionsSi;
      correct = template.correctAnswerSi;
      expl = template.explanationSi;
      outcome = template.outcomeSi;
    }

    const gradeStr = (params.grade || '').toLowerCase();
    const isAdvancedLevel = gradeStr.includes('grade 12') || gradeStr.includes('grade 13') || gradeStr.includes('a/l') || gradeStr.includes('உயர்தரம்');
    const isEarlyPrimary = gradeStr.includes('grade 1') || gradeStr.includes('grade 2') || gradeStr.includes('grade 3');

    // Configurable Option Scaling (3, 4, 5, அல்லது 6 விடைத் தெரிவுகள்)
    const targetCount = params.optionsCount && params.optionsCount >= 2 && params.optionsCount <= 6
      ? params.optionsCount
      : (isEarlyPrimary ? 3 : isAdvancedLevel ? 5 : 4);

    if (opts.length > targetCount) {
      const trimmed = opts.slice(0, targetCount);
      if (!trimmed.includes(correct)) {
        trimmed[trimmed.length - 1] = correct;
      }
      opts = trimmed;
    } else if (opts.length < targetCount) {
      const extraDistractorsTa = [
        'மேற்கூறிய எதுவுமில்லை',
        'கூற்றுக்கள் அனைத்தும் சரியானவை',
        'A மற்றும் B இரண்டும் சரியானவை',
        'விடை தீர்மானிக்க போதுமான தகவல் இல்லை',
      ];
      const extraDistractorsEn = [
        'None of the above',
        'All of the above statements are correct',
        'Both A and B are correct',
        'Insufficient information to determine',
      ];
      const extraDistractorsSi = [
        'ඉහත කිසිවක් නොවේ',
        'ඉහත සියලු ප්‍රකාශ නිවැරදිය',
        'A සහ B දෙකම නිවැරදිය',
        'තීරණය කිරීමට ප්‍රමාණවත් තොරතුරු නොමැත',
      ];
      const pool = medium === 'Tamil' ? extraDistractorsTa : medium === 'Sinhala' ? extraDistractorsSi : extraDistractorsEn;
      let pIdx = 0;
      while (opts.length < targetCount) {
        const candidate = pool[pIdx % pool.length];
        if (!opts.includes(candidate) && candidate !== correct) {
          opts.push(candidate);
        } else {
          opts.push(`${medium === 'Tamil' ? 'விடை தெரிவு' : 'Option'} ${String.fromCharCode(65 + opts.length)}`);
        }
        pIdx++;
      }
    }

    // If more questions needed than templates, customize with item numbers
    const suffix = i >= matched.length ? ` (பகுதி ${Math.floor(i / matched.length) + 1})` : '';

    questions.push({
      id: qId,
      type: 'multiple_choice',
      questionText: `${qText}${suffix}`,
      options: [...opts],
      correctAnswer: correct,
      marks: 2,
      explanation: expl,
      learningOutcome: outcome,
      difficulty: params.difficulty || 'Medium',
    });
  }

  let modeTitleEn = 'Academic Challenge';
  let modeTitleTa = 'கல்விச் சவால்';
  if (mode === 'exam') {
    modeTitleEn = 'Official Term Examination';
    modeTitleTa = 'தவணைப் பரீட்சை வினாத்தாள்';
  } else if (mode === 'competition') {
    modeTitleEn = 'National Academic Olympiad';
    modeTitleTa = 'தேசிய கல்வி ஒலிம்பியாட்';
  } else if (mode === 'island_quest') {
    modeTitleEn = 'Sri Lanka Island Quest';
    modeTitleTa = 'இலங்கைத் தீவு வினா வேட்டை';
  } else if (mode === 'edu_arena') {
    modeTitleEn = 'Edu Arena Speed Championship';
    modeTitleTa = 'கல்வி அரங்கு மின்னல் வேகப் போட்டி';
  } else if (mode === 'district_quiz') {
    modeTitleEn = `${district || 'All-Island'} 25 Districts Championship`;
    modeTitleTa = `${district || 'அனைத்திலங்கை'} 25 மாவட்ட வினாடி வினா`;
  }

  const finalTitle = medium === 'Tamil'
    ? `${subject} • ${modeTitleTa} (${params.grade || 'தரம் 10'})`
    : `${subject} • ${modeTitleEn} (${params.grade || 'Grade 10'})`;

  const finalDesc = medium === 'Tamil'
    ? `இலங்கை கல்வி அமைச்சு (NIE) மற்றும் பரீட்சைத் திணைக்கள பாடத்திட்டத் தரநிலைகளுக்கு அமைவாகத் தொகுக்கப்பட்ட உத்தியோகபூர்வ மாதிரி வினாத்தாள்.`
    : `Official national curriculum-aligned examination paper developed strictly in accordance with NIE and Sri Lankan Department of Examinations standards.`;

  return {
    title: finalTitle,
    description: finalDesc,
    competitionType: mode === 'exam' ? 'Exam' : mode === 'island_quest' ? 'Island Quest' : mode === 'edu_arena' ? 'Edu Arena' : mode === 'district_quiz' ? 'District Quiz' : mode === 'competition' ? 'Competition' : 'Quiz',
    category: subject,
    subject: subject,
    grade: params.grade || 'Grade 10',
    language: medium,
    duration: duration,
    district: district,
    scope: district ? 'district' : 'all_island',
    prizeDetails: {
      firstPrize: '1st Place Gold Medal & Honors Certificate',
      secondPrize: '2nd Place Silver Medal',
      thirdPrize: '3rd Place Bronze Medal',
      participationCertificate: 'Digital Certificate of Academic Merit',
    },
    questions,
  };
}

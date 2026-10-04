export interface SriLankaDistrictInfo {
  id: string; // e.g., 'colombo', 'jaffna', 'anuradhapura'
  nameEn: string;
  nameTa: string;
  nameSi: string;
  provinceEn: string;
  provinceTa: string;
  icon: string;
  levelNumber: number;
  gradeSubject: string;
  gradeSubjectEn: string;
  descriptionTa: string;
  descriptionEn: string;
  defaultPoints: number;
  initialQuestions: {
    id: string;
    questionText: string;
    options: {
      shape: 'triangle' | 'square' | 'circle' | 'diamond';
      symbol: string;
      text: string;
      color: string;
      hoverColor: string;
      borderColor: string;
    }[];
    correctIndex: number;
    hint: string;
    explanation: string;
  }[];
}

export const PROVINCES_OF_SRI_LANKA = [
  { id: 'western', nameEn: 'Western Province', nameTa: 'மேல் மாகாணம்', districts: ['colombo', 'gampaha', 'kalutara'] },
  { id: 'central', nameEn: 'Central Province', nameTa: 'மத்திய மாகாணம்', districts: ['kandy', 'matale', 'nuwara_eliya'] },
  { id: 'southern', nameEn: 'Southern Province', nameTa: 'தென் மாகாணம்', districts: ['galle', 'matara', 'hambantota'] },
  { id: 'northern', nameEn: 'Northern Province', nameTa: 'வட மாகாணம்', districts: ['jaffna', 'kilinochchi', 'mannar', 'vavuniya', 'mullaitivu'] },
  { id: 'eastern', nameEn: 'Eastern Province', nameTa: 'கிழக்கு மாகாணம்', districts: ['batticaloa', 'ampara', 'trincomalee'] },
  { id: 'north_western', nameEn: 'North Western Province', nameTa: 'வடமேல் மாகாணம்', districts: ['kurunegala', 'puttalam'] },
  { id: 'north_central', nameEn: 'North Central Province', nameTa: 'வடமத்திய மாகாணம்', districts: ['anuradhapura', 'polonnaruwa'] },
  { id: 'uva', nameEn: 'Uva Province', nameTa: 'ஊவா மாகாணம்', districts: ['badulla', 'monaragala'] },
  { id: 'sabaragamuwa', nameEn: 'Sabaragamuwa Province', nameTa: 'சப்ரகமுவ மாகாணம்', districts: ['ratnapura', 'kegalle'] },
];

export const SRI_LANKA_25_DISTRICTS: SriLankaDistrictInfo[] = [
  // 1. Anuradhapura
  {
    id: 'anuradhapura',
    levelNumber: 1,
    nameEn: 'Anuradhapura',
    nameTa: 'அனுராதபுரம்',
    nameSi: 'අනුරාධපුරය',
    provinceEn: 'North Central Province',
    provinceTa: 'வடமத்திய மாகாணம்',
    icon: '🏛️',
    gradeSubject: 'தரம் 8 • வரலாறு & பாரம்பரியம்',
    gradeSubjectEn: 'Grade 8 • History & Heritage',
    descriptionTa: 'இலங்கையின் ஆதி தலைநகரம் மற்றும் பண்டைய பாசன நாகரிகத்தின் தாயகம்.',
    descriptionEn: 'Ancient capital of Sri Lanka and cradle of hydraulic civilization.',
    defaultPoints: 120,
    initialQuestions: [
      {
        id: 'q_anu_1',
        questionText: 'அனுராதபுர இராச்சியத்தை திட்டமிட்டு தோற்றுவித்த மன்னன் யார்?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'பண்டுவசுதேவன்', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'பராக்கிரமபாகு', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'பண்டுகாபயன்', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'தேவநம்பியதீசன்', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 2,
        hint: 'இவர் கி.மு 4ம் நூற்றாண்டில் நகரை வடிவமைத்தார்.',
        explanation: 'பண்டுகாபய மன்னன் அனுராதபுரத்தை முறைப்படி திட்டமிட்ட தலைநகராகத் தோற்றுவித்து ஆட்சி செய்தார்.',
      },
      {
        id: 'q_anu_2',
        questionText: 'இலங்கைக்கு பௌத்த மதத்தை கொண்டு வந்து அறிமுகப்படுத்தியவர் யார்?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'மகிந்த தேரர் (மஹிந்த ரஹத்தன்)', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'அசோக பேரரசர்', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'மகாசேன மன்னன்', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'சங்கமித்தை தேரி', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 0,
        hint: 'மிஹிந்தலையில் தேவநம்பியதீச மன்னனை சந்தித்தார்.',
        explanation: 'அசோக சக்கரவர்த்தியின் புதல்வரான மகிந்த தேரர் மிஹிந்தலையில் இலங்கைக்கு பௌத்தத்தை உபதேசித்தார்.',
      },
    ],
  },
  // 2. Colombo
  {
    id: 'colombo',
    levelNumber: 2,
    nameEn: 'Colombo',
    nameTa: 'கொழும்பு',
    nameSi: 'කොළඹ',
    provinceEn: 'Western Province',
    provinceTa: 'மேல் மாகாணம்',
    icon: '🏢',
    gradeSubject: 'தரம் 10 • புவியியல் & பொருளாதாரம்',
    gradeSubjectEn: 'Grade 10 • Geography & Economy',
    descriptionTa: 'இலங்கையின் வர்த்தகத் தலைநகரம் மற்றும் சர்வதேச துறைமுக நகரம்.',
    descriptionEn: 'Commercial capital and international port hub of Sri Lanka.',
    defaultPoints: 130,
    initialQuestions: [
      {
        id: 'q_col_1',
        questionText: 'இலங்கையின் மிக நீளமான நதி எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'களனி கங்கை', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'மகாவலி கங்கை (335 km)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'களு கங்கை', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'வளவை கங்கை', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'திருகோணமலை கொட்டியார விரிகுடாவில் கலக்கிறது.',
        explanation: 'மகாவலி கங்கை 335 கி.மீ நீளம் கொண்ட இலங்கையின் மிக நீளமான நதியாகும்.',
      },
    ],
  },
  // 3. Jaffna
  {
    id: 'jaffna',
    levelNumber: 3,
    nameEn: 'Jaffna',
    nameTa: 'யாழ்ப்பாணம்',
    nameSi: 'යාපනය',
    provinceEn: 'Northern Province',
    provinceTa: 'வட மாகாணம்',
    icon: '🌴',
    gradeSubject: 'தரம் 9 • தமிழ் மொழி & இலக்கியம்',
    gradeSubjectEn: 'Grade 9 • Tamil Literature & Culture',
    descriptionTa: 'தமிழ் இலக்கியம், சைவ கலாச்சாரம் மற்றும் கல்விச் சிறப்பு மிக்க மண்.',
    descriptionEn: 'Cradle of Tamil literature, arts, and academic excellence.',
    defaultPoints: 140,
    initialQuestions: [
      {
        id: 'q_jaf_1',
        questionText: 'நல்லை நகர் ஆறுமுக நாவலர் தமிழுக்கு ஆற்றிய தலைசிறந்த பங்களிப்பு யாது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'வசன நடை கைவந்த வள்ளலாராக உரைநடை வளர்த்தல்', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'சிலப்பதிகாரத்திற்கு முழு உரை எழுதுதல்', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'ஆங்கில அகராதி உருவாக்குதல்', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'நாடகங்களை மொழிபெயர்த்தல்', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 0,
        hint: 'பரிதிமாற்கலைஞர் இவரைப் போற்றிய பட்டம்.',
        explanation: 'ஆறுமுக நாவலர் தமிழ் உரைநடை இலக்கியத்தை வளர்த்தெடுத்த முன்னோடியாவார்.',
      },
    ],
  },
  // 4. Kandy
  {
    id: 'kandy',
    levelNumber: 4,
    nameEn: 'Kandy',
    nameTa: 'கண்டி',
    nameSi: 'මහනුවර',
    provinceEn: 'Central Province',
    provinceTa: 'மத்திய மாகாணம்',
    icon: '👑',
    gradeSubject: 'A/L உயர்தரம் • பொது அறிவு & பண்பாடு',
    gradeSubjectEn: 'A/L • General Knowledge & Heritage',
    descriptionTa: 'இறுதி மன்னராட்சி தலைநகரம் மற்றும் புனித தந்த தாதுவின் உறைவிடம்.',
    descriptionEn: 'Last royal capital of Sri Lanka and seat of the Sacred Tooth Relic.',
    defaultPoints: 150,
    initialQuestions: [
      {
        id: 'q_kan_1',
        questionText: 'கண்டி தலதா மாளிகையின் எண்கோண வடிவ மண்டபத்தின் பெயர் என்ன?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'மால்வத்தை மண்டபம்', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'பத்திரிப்பு (Pattirippuwa)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'மகா மழுவ', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'ஸ்ரீ தலதா உட்சபையம்', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'ஸ்ரீ விக்கிரம ராஜசிங்கனால் கட்டப்பட்டது.',
        explanation: 'பத்திரிப்பு என்பது வரலாற்றுச் சிறப்புமிக்க எண்கோண அமைப்பாகும்.',
      },
    ],
  },
  // 5. Galle
  {
    id: 'galle',
    levelNumber: 5,
    nameEn: 'Galle',
    nameTa: 'காலி',
    nameSi: 'ගාල්ල',
    provinceEn: 'Southern Province',
    provinceTa: 'தென் மாகாணம்',
    icon: '⚓',
    gradeSubject: 'தரம் 11 • விஞ்ஞானம் & சூழலியல்',
    gradeSubjectEn: 'Grade 11 • Science & Oceanography',
    descriptionTa: 'யுனெஸ்கோ உலக பாரம்பரியக் கோட்டை மற்றும் கடல்சார் ஆய்வுக் களம்.',
    descriptionEn: 'UNESCO World Heritage Dutch Fort and historic maritime center.',
    defaultPoints: 140,
    initialQuestions: [
      {
        id: 'q_gal_1',
        questionText: 'ஒளிச்சேர்க்கையின் போது தாவரங்களால் வெளிவிடப்படும் வாயு எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'காபனீரொட்சைட்டு (CO₂)', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'ஒக்சிஜன் வாயு (O₂)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'நைதரசன் வாயு (N₂)', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'ஹைட்ரஜன் வாயு (H₂)', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'சுவாசத்திற்கு மிக முக்கியமானது.',
        explanation: 'தாவரங்கள் ஒளிச்சேர்க்கையில் ஒக்சிஜனை வெளிவிடுகின்றன.',
      },
    ],
  },
  // 6. Batticaloa
  {
    id: 'batticaloa',
    levelNumber: 6,
    nameEn: 'Batticaloa',
    nameTa: 'மட்டக்களப்பு',
    nameSi: 'මඩකලපුව',
    provinceEn: 'Eastern Province',
    provinceTa: 'கிழக்கு மாகாணம்',
    icon: '🐬',
    gradeSubject: 'தரம் 10 • கணிதம் & தர்க்கவியல்',
    gradeSubjectEn: 'Grade 10 • Mathematics & Logic',
    descriptionTa: 'பாடும் மீன்களின் தேசம், களப்பு எழில் மற்றும் கணிதப் புதிர்களின் தளம்.',
    descriptionEn: 'Land of the singing fish, lagoon beauty, and mathematical problem solving.',
    defaultPoints: 130,
    initialQuestions: [
      {
        id: 'q_bat_1',
        questionText: 'ஒரு தள முக்கோணியின் அகக்கோணங்களின் கூட்டுத்தொகை யாது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: '90°', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: '180°', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: '360°', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: '270°', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'இரண்டு செங்கோணங்களுக்கு சமம்.',
        explanation: 'எந்தவொரு தள முக்கோணத்தின் மூன்று கோணங்களின் கூட்டுத்தொகை 180° ஆகும்.',
      },
    ],
  },
  // 7. Gampaha
  {
    id: 'gampaha',
    levelNumber: 7,
    nameEn: 'Gampaha',
    nameTa: 'கம்பஹா',
    nameSi: 'ගම්පහ',
    provinceEn: 'Western Province',
    provinceTa: 'மேல் மாகாணம்',
    icon: '🌿',
    gradeSubject: 'தரம் 9 • விஞ்ஞானம் & தாவரவியல்',
    gradeSubjectEn: 'Grade 9 • Botanical Sciences',
    descriptionTa: 'ஹெனரத்கொட தாவரவியல் பூங்கா மற்றும் இலங்கையின் முதன்மை இறப்பர் செய்கை மையம்.',
    descriptionEn: 'Home to Henarathgoda Botanical Garden where rubber was first planted.',
    defaultPoints: 125,
    initialQuestions: [
      {
        id: 'q_gam_1',
        questionText: 'இலங்கையில் முதன்முதலில் இறப்பர் மரம் நடப்பட்ட இடம் எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'பேராதனை பூங்கா', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'ஹெனரத்கொட தாவரவியல் பூங்கா (கம்பஹா)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'ஹக்கல பூங்கா', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'விக்டோரியா பூங்கா', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: '1876 இல் பிரேசிலில் இருந்து கொண்டுவரப்பட்டது.',
        explanation: 'கம்பஹாவில் உள்ள ஹெனரத்கொட தாவரவியல் பூங்காவிலேயே இலங்கையின் முதல் ரப்பர் மரம் நடப்பட்டது.',
      },
    ],
  },
  // 8. Kalutara
  {
    id: 'kalutara',
    levelNumber: 8,
    nameEn: 'Kalutara',
    nameTa: 'களுத்துறை',
    nameSi: 'කළුතර',
    provinceEn: 'Western Province',
    provinceTa: 'மேல் மாகாணம்',
    icon: '🌉',
    gradeSubject: 'தரம் 8 • சமூகக் கல்வி & கலாச்சாரம்',
    gradeSubjectEn: 'Grade 8 • Social Studies',
    descriptionTa: 'களு கங்கை முகத்துவாரம், பிரம்மாண்ட வெற்று தாதுகோபுரம் மற்றும் மங்கொஸ்தீன் உற்பத்திக் களம்.',
    descriptionEn: 'Famous for Kalutara Bodhiya, hollow stupa, and mangosteen fruit.',
    defaultPoints: 120,
    initialQuestions: [
      {
        id: 'q_kal_1',
        questionText: 'உலகின் ஒரேயொரு உட்புறம் வெற்று அமைப்பைக் கொண்ட தாதுகோபுரம் எங்குள்ளது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'களுத்துறை போதி வளாகம்', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'அனுராதபுரம் ருவன்வெலிசாய', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'பொலன்னறுவை ரங்கொத் விகாரை', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'களனி விகாரை', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 0,
        hint: 'களு கங்கை பாலத்தின் அருகில் அமைந்துள்ளது.',
        explanation: 'களுத்துறை சைத்தியம் உலகின் ஒரே உட்புறம் செல்லக்கூடிய வெற்று தாதுகோபுர அமைப்பாகும்.',
      },
    ],
  },
  // 9. Matale
  {
    id: 'matale',
    levelNumber: 9,
    nameEn: 'Matale',
    nameTa: 'மாத்தளை',
    nameSi: 'මාතලේ',
    provinceEn: 'Central Province',
    provinceTa: 'மத்திய மாகாணம்',
    icon: '🏰',
    gradeSubject: 'தரம் 9 • வரலாறு & வாசனைத் திரவியங்கள்',
    gradeSubjectEn: 'Grade 9 • History & Spices',
    descriptionTa: 'சீகிரிய குன்றின் எல்லை, அலுவிகாரை திரிபிடக எழுத்து மற்றும் நறுமணத் திரவியத் தோட்டம்.',
    descriptionEn: 'Aluvihara rock temple where Tripitaka was written and spice gardens.',
    defaultPoints: 135,
    initialQuestions: [
      {
        id: 'q_mat_1',
        questionText: 'பௌத்த திரிபிடகம் முதன்முதலில் ஓலைச்சுவடிகளில் எழுதப்பட்ட வரலாற்று முக்கியத்துவம் வாய்ந்த இடம் எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'தம்புள்ளை குகை விகாரை', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'மாத்தளை அலுவிகாரை', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'சீகிரியா குன்று', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'ரிதிகம விகாரை', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'வலகம்பா மன்னன் காலத்தில் எழுதப்பட்டது.',
        explanation: 'மாத்தளை அலுவிகாரையிலேயே வாய்வழியாக வந்த திரிபிடகம் எழுத்து வடிவில் பதியப்பட்டது.',
      },
    ],
  },
  // 10. Nuwara Eliya
  {
    id: 'nuwara_eliya',
    levelNumber: 10,
    nameEn: 'Nuwara Eliya',
    nameTa: 'நுவரெலியா',
    nameSi: 'නුවරඑළිය',
    provinceEn: 'Central Province',
    provinceTa: 'மத்திய மாகாணம்',
    icon: '🍵',
    gradeSubject: 'தரம் 10 • புவியியல் & காலநிலை',
    gradeSubjectEn: 'Grade 10 • Geography & Tea Industry',
    descriptionTa: 'குளிர்ந்த மலைத்தொடர்கள், உலகப் புகழ்பெற்ற சிலோன் தேயிலை மற்றும் பனிபடர்ந்த சிகரங்கள்.',
    descriptionEn: 'Little England, high mountain ranges, and finest Ceylon Tea estates.',
    defaultPoints: 140,
    initialQuestions: [
      {
        id: 'q_nuw_1',
        questionText: 'இலங்கையில் உள்ள ஒரேயொரு மேட்டுநில சமவெளி தேசிய பூங்கா எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'வில்பத்து', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'ஹோர்டன் சமவெளி (Horton Plains)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'யால பூங்கா', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'மின்னேரியா', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'உலக முடிவு (World’s End) செங்குத்துப் பாறை இங்குள்ளது.',
        explanation: 'ஹோர்டன் சமவெளி நுவரெலியாவில் உள்ள உலகப்புகழ் பெற்ற மேட்டுநில மழைக்காட்டுப் பூங்காவாகும்.',
      },
    ],
  },
  // 11. Matara
  {
    id: 'matara',
    levelNumber: 11,
    nameEn: 'Matara',
    nameTa: 'மாத்தறை',
    nameSi: 'මාතර',
    provinceEn: 'Southern Province',
    provinceTa: 'தென் மாகாணம்',
    icon: '🗼',
    gradeSubject: 'தரம் 8 • இலக்கியம் & கல்வி',
    gradeSubjectEn: 'Grade 8 • Literature & Culture',
    descriptionTa: 'நிலவள முனையம் (Dondra Head), உமாங் கலா விகாரை மற்றும் தென்னக இலக்கிய பூமி.',
    descriptionEn: 'Southernmost point of Sri Lanka (Dondra Head) and southern education hub.',
    defaultPoints: 120,
    initialQuestions: [
      {
        id: 'q_matar_1',
        questionText: 'இலங்கையின் நிலப்பரப்பில் மிகத் தெற்கே அமைந்துள்ள கலங்கரை விளக்கம் எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'காலி கலங்கரை விளக்கம்', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'தேவேந்திர முனை (Dondra Head)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'சங்கமன்கந்தை முனை', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'பருத்தித்துறை கலங்கரை விளக்கம்', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'மாத்தறைக்கு அருகில் உள்ள தென்னக முனை.',
        explanation: 'தேவேந்திர முனை கலங்கரை விளக்கம் இலங்கையின் மிக உயரமானதும் தெற்கே அமைந்ததுமாகும்.',
      },
    ],
  },
  // 12. Hambantota
  {
    id: 'hambantota',
    levelNumber: 12,
    nameEn: 'Hambantota',
    nameTa: 'அம்பாந்தோட்டை',
    nameSi: 'හම්බන්තොට',
    provinceEn: 'Southern Province',
    provinceTa: 'தென் மாகாணம்',
    icon: '🦚',
    gradeSubject: 'தரம் 10 • உவர்மண் சூழல் & வனவிலங்கு',
    gradeSubjectEn: 'Grade 10 • Ecology & Ports',
    descriptionTa: 'உப்பு விளைச்சல், புகழ்பெற்ற ருஹுணு யால தேசிய பூங்கா மற்றும் சர்வதேச ஆழ்கடல் துறைமுகம்.',
    descriptionEn: 'Famous for Bundala, Yala Safari, salt pans, and southern development.',
    defaultPoints: 130,
    initialQuestions: [
      {
        id: 'q_ham_1',
        questionText: 'இலங்கையில் மிக அதிகமான சிறுத்தைகள் அடர்த்தியாக வாழும் தேசிய பூங்கா எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'யால தேசிய பூங்கா (Yala National Park)', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'உடவளவ பூங்கா', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'சிங்கராஜ காடு', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'வில்பத்து', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 0,
        hint: 'அம்பாந்தோட்டை மற்றும் மொனராகலை எல்லைகளில் பரவியுள்ளது.',
        explanation: 'யால பூங்கா உலகிலேயே ஒரு சதுர கி.மீட்டருக்கு அதிக சிறுத்தைகள் வாழும் புகழ்பெற்ற சரணாலயமாகும்.',
      },
    ],
  },
  // 13. Kilinochchi
  {
    id: 'kilinochchi',
    levelNumber: 13,
    nameEn: 'Kilinochchi',
    nameTa: 'கிளிநொச்சி',
    nameSi: 'කිලිනොච්චිය',
    provinceEn: 'Northern Province',
    provinceTa: 'வட மாகாணம்',
    icon: '🌾',
    gradeSubject: 'தரம் 9 • விவசாயம் & நீர்ப்பாசனம்',
    gradeSubjectEn: 'Grade 9 • Agriculture & Irrigation',
    descriptionTa: 'இரணைமடுப் பெருங்குளம், நெற்செய்கை செழிப்பு மற்றும் வடபுல பாசனப் பூமி.',
    descriptionEn: 'Heart of Northern agricultural granary and majestic Iranamadu tank.',
    defaultPoints: 125,
    initialQuestions: [
      {
        id: 'q_kil_1',
        questionText: 'வட மாகாணத்தின் மிகப்பெரிய நீர்ப்பாசன குளம் எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'இரணைமடு குளம் (Iranamadu Tank)', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'முத்தையன்கட்டு குளம்', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'கல்மடு குளம்', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'வவுனிக்குளம்', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 0,
        hint: 'கிளிநொச்சியின் நெற்களஞ்சியத்திற்கு உயிர்நாடியாக விளங்குகிறது.',
        explanation: 'இரணைமடு குளம் கனகராயன் ஆற்றை மறித்துக் கட்டப்பட்ட வடக்கின் மாபெரும் நீர்ப்பாசனக் குளமாகும்.',
      },
    ],
  },
  // 14. Mannar
  {
    id: 'mannar',
    levelNumber: 14,
    nameEn: 'Mannar',
    nameTa: 'மன்னார்',
    nameSi: 'මන්නාරම',
    provinceEn: 'Northern Province',
    provinceTa: 'வட மாகாணம்',
    icon: '⛪',
    gradeSubject: 'தரம் 8 • வரலாறு & புவியியல்',
    gradeSubjectEn: 'Grade 8 • Historic Trade & Ecology',
    descriptionTa: 'பண்டைய மாதோட்டத் துறைமுகம், திருக்கேதீச்சரம், பாவோபாப் மரம் மற்றும் ஆதாம் பாலம்.',
    descriptionEn: 'Ancient port of Mantai, historic Baobab trees, and Adam’s Bridge.',
    defaultPoints: 130,
    initialQuestions: [
      {
        id: 'q_man_1',
        questionText: 'மன்னாருக்கு அரேபிய வணிகர்களால் கொண்டுவந்து நடப்பட்ட விநோதமான பழமையான மரம் எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'ஆலமரம்', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'பாவோபாப் மரம் (யானை மரம் / Baobab)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'ஈச்ச மரம்', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'செம்மரம்', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'ஆப்பிரிக்காவைத் தாயகமாகக் கொண்ட பெருந்தண்டு மரம்.',
        explanation: 'பாவோபாப் மரங்கள் (Baobab) மன்னாருக்கு அரேபிய ஒட்டக வணிகர்களால் பல நூற்றாண்டுகளுக்கு முன் கொண்டுவரப்பட்டன.',
      },
    ],
  },
  // 15. Vavuniya
  {
    id: 'vavuniya',
    levelNumber: 15,
    nameEn: 'Vavuniya',
    nameTa: 'வவுனியா',
    nameSi: 'වවුනියාව',
    provinceEn: 'Northern Province',
    provinceTa: 'வட மாகாணம்',
    icon: '🚪',
    gradeSubject: 'தரம் 9 • தொடர்பாடல் & போக்குவரத்து',
    gradeSubjectEn: 'Grade 9 • Gateway & Heritage',
    descriptionTa: 'வடபுலத்தின் பிரதான நுழைவாயில் நகரம் மற்றும் பன்முக கலாச்சார சந்திப்பு.',
    descriptionEn: 'The historic gateway to the Northern province connecting north and south.',
    defaultPoints: 120,
    initialQuestions: [
      {
        id: 'q_vav_1',
        questionText: 'வட மாகாணத்தின் "நுழைவாயில் நகரம்" (Gateway City) என்று அழைக்கப்படும் மாவட்டம் எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'வவுனியா', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'மன்னார்', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'யாழ்ப்பாணம்', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'முல்லைத்தீவு', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 0,
        hint: 'ஏ9 நெடுஞ்சாலையில் வடக்கையும் தெற்கையும் இணைக்கும் மையம்.',
        explanation: 'வவுனியா வட மாகாணத்திற்குள் நுழையும் முக்கிய நுழைவாயிலாக அமைந்த நகரமாகும்.',
      },
    ],
  },
  // 16. Mullaitivu
  {
    id: 'mullaitivu',
    levelNumber: 16,
    nameEn: 'Mullaitivu',
    nameTa: 'முல்லைத்தீவு',
    nameSi: 'මුලතිව්',
    provinceEn: 'Northern Province',
    provinceTa: 'வட மாகாணம்',
    icon: '🌊',
    gradeSubject: 'தரம் 10 • காடுகள் & சூழலியல்',
    gradeSubjectEn: 'Grade 10 • Coastal & Forest Ecology',
    descriptionTa: 'நந்திக்கடல் களப்பு, அடர்ந்த வன்னிக் காடுகள் மற்றும் கடல்வள பூமி.',
    descriptionEn: 'Rich coastline, Nandikadal lagoon, and dense Vanni forests.',
    defaultPoints: 125,
    initialQuestions: [
      {
        id: 'q_mul_1',
        questionText: 'முல்லைத்தீவு மாவட்டத்தில் அமைந்துள்ள புகழ்பெற்ற உவர்நீர் களப்பு எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'நந்திக்கடல் களப்பு', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'மட்டக்களப்பு வாவி', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'களபு ஓயா', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'புத்தளம் களப்பு', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 0,
        hint: 'கடலோடு இணையும் அகன்ற உவர்நீர் பகுதி.',
        explanation: 'நந்திக்கடல் முல்லைத்தீவின் இயற்கை சூழலியல் மற்றும் மீன்வளத்தில் முக்கிய களப்பாகும்.',
      },
    ],
  },
  // 17. Ampara
  {
    id: 'ampara',
    levelNumber: 17,
    nameEn: 'Ampara',
    nameTa: 'அம்பாறை',
    nameSi: 'අම්පාර',
    provinceEn: 'Eastern Province',
    provinceTa: 'கிழக்கு மாகாணம்',
    icon: '🏄‍♂️',
    gradeSubject: 'தரம் 9 • புவியியல் & நீர்ப்பாசனம்',
    gradeSubjectEn: 'Grade 9 • Geography & Gal Oya System',
    descriptionTa: 'சேனாநாயக்க சமுத்திரம், அருக்கம்பை (Arugam Bay) மற்றும் கிழக்கு நெற்களஞ்சியம்.',
    descriptionEn: 'Senanayake Samudraya, world-class Arugam Bay surfing, and rice fields.',
    defaultPoints: 135,
    initialQuestions: [
      {
        id: 'q_amp_1',
        questionText: 'சுதந்திரத்திற்குப் பின் இலங்கையில் அமைக்கப்பட்ட முதலாவது பாரிய பலநோக்கு நீர்த்தேக்கம் எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'விக்டோரியா நீர்த்தேக்கம்', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'சேனாநாயக்க சமுத்திரம் (கல் ஓயா திட்டம்)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'ரந்தெனிகல', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'கொத்மலை', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'அம்பாறையில் கல் ஓயா பள்ளத்தாக்கில் உருவாக்கப்பட்டது.',
        explanation: 'சேனாநாயக்க சமுத்திரம் 1949 இல் தொடங்கப்பட்ட இலங்கையின் முதல் மாபெரும் நீர்த்தேக்கமாகும்.',
      },
    ],
  },
  // 18. Trincomalee
  {
    id: 'trincomalee',
    levelNumber: 18,
    nameEn: 'Trincomalee',
    nameTa: 'திருகோணமலை',
    nameSi: 'ත්රිකුණාමලය',
    provinceEn: 'Eastern Province',
    provinceTa: 'கிழக்கு மாகாணம்',
    icon: '🦌',
    gradeSubject: 'தரம் 10 • வரலாறு & துறைமுகங்கள்',
    gradeSubjectEn: 'Grade 10 • Natural Harbor & Heritage',
    descriptionTa: 'உலகின் மாபெரும் இயற்கை துறைமுகம், திருக்கோணேச்சரம், கன்னியா வெந்நீரூற்று மற்றும் சுவாமி பாறை.',
    descriptionEn: 'One of the finest natural deep-water harbors, Koneswaram, and hot springs.',
    defaultPoints: 145,
    initialQuestions: [
      {
        id: 'q_tri_1',
        questionText: 'திருகோணமலையில் அமைந்துள்ள உலகின் தலைசிறந்த துறைமுக வகை எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'செயற்கைத் துறைமுகம்', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'இயற்கை ஆழ்கடல் துறைமுகம் (Natural Deep Harbor)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'நதி முகத்துவாரத் துறைமுகம்', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'தற்காலிக நங்கூரத் தளம்', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'இந்தியப் பெருங்கடலின் மிகச் சிறந்த பாதுகாப்பு தளம்.',
        explanation: 'திருகோணமலை துறைமுகம் உலகின் 5வது மிகப்பெரிய இயற்கை ஆழ்கடல் துறைமுகமாகும்.',
      },
    ],
  },
  // 19. Kurunegala
  {
    id: 'kurunegala',
    levelNumber: 19,
    nameEn: 'Kurunegala',
    nameTa: 'குருநாகல்',
    nameSi: 'කුරුණෑගල',
    provinceEn: 'North Western Province',
    provinceTa: 'வடமேல் மாகாணம்',
    icon: '🐘',
    gradeSubject: 'தரம் 8 • வரலாறு & குன்றுகள்',
    gradeSubjectEn: 'Grade 8 • Medieval Capital',
    descriptionTa: 'யானைக் குன்று (Ethagala), இடைக்கால தலைநகரம் மற்றும் தென்னை முக்கோணத்தின் அங்கம்.',
    descriptionEn: 'Medieval royal capital guarded by elephant rock (Ethagala).',
    defaultPoints: 120,
    initialQuestions: [
      {
        id: 'q_kur_1',
        questionText: 'குருநாகல் நகரை கம்பீரமாகக் காத்து நிற்கும் யானை வடிவப் பாறை குன்றின் பெயர் என்ன?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'ஆமைப் பாறை', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'எத்தகல (Ethagala / யானைக் குன்று)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'குரங்குப் பாறை', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'கழுகுப் பாறை', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'குன்றின் மீது பெரிய புத்தர் சிலை அமைக்கப்பட்டுள்ளது.',
        explanation: 'எத்தகல என்பது குருநாகல் நகரின் அடையாளமான 325 மீட்டர் உயர யானை வடிவக் குன்றாகும்.',
      },
    ],
  },
  // 20. Puttalam
  {
    id: 'puttalam',
    levelNumber: 20,
    nameEn: 'Puttalam',
    nameTa: 'புத்தளம்',
    nameSi: 'පුත්තලම',
    provinceEn: 'North Western Province',
    provinceTa: 'வடமேல் மாகாணம்',
    icon: '🧂',
    gradeSubject: 'தரம் 10 • சக்தி வளம் & உப்பு உற்பத்தி',
    gradeSubjectEn: 'Grade 10 • Energy & Marine Resources',
    descriptionTa: 'உப்பு உற்பத்திக் களம், காற்றாலை மின்சாரம், கல்பட்டி டொல்பின் சரணாலயம் மற்றும் வில்பத்து நுழைவு.',
    descriptionEn: 'Vast salt pans, wind energy hub, Kalpitiya dolphin watching, and Wilpattu.',
    defaultPoints: 130,
    initialQuestions: [
      {
        id: 'q_put_1',
        questionText: 'இலங்கையில் முதன்முதலில் பாரிய காற்றாலை மின் உற்பத்தி பூங்கா அமைக்கப்பட்ட பிரதேசம் எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'கல்பட்டி / புத்தளம் கடலோரப் பகுதி', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'மன்னார் விரிகுடா', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'காலி துறைமுகம்', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'திருகோணமலை', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 0,
        hint: 'தொடர்ச்சியான பலத்த கடல் காற்று வீசும் கடற்கரை வலயமாகும்.',
        explanation: 'புத்தளம் மற்றும் கல்பட்டி கடலோரங்கள் இலங்கையின் முதன்மை காற்றாலை மின் மையங்களாகும்.',
      },
    ],
  },
  // 21. Polonnaruwa
  {
    id: 'polonnaruwa',
    levelNumber: 21,
    nameEn: 'Polonnaruwa',
    nameTa: 'பொலன்னறுவை',
    nameSi: 'පොළොන්නරුව',
    provinceEn: 'North Central Province',
    provinceTa: 'வடமத்திய மாகாணம்',
    icon: '🗿',
    gradeSubject: 'தரம் 8 • வரலாறு & நீர்ப்பாசனப் பொறியியல்',
    gradeSubjectEn: 'Grade 8 • Medieval Hydraulic Engineering',
    descriptionTa: 'பராக்கிரம சமுத்திரம், கல் விகாரை, நிலக்கீழ் அரண்மனை மற்றும் பொற்கால பாசனத் தலைநகரம்.',
    descriptionEn: 'Parakrama Samudra, Gal Vihara stone sculptures, and medieval golden age.',
    defaultPoints: 140,
    initialQuestions: [
      {
        id: 'q_pol_1',
        questionText: '"வானிலிருந்து விழும் ஒரு துளி மழைநீரையும் மனிதப் பயன்பாடின்றி கடலில் கலக்க விடமாட்டேன்" என்று கூறிய மன்னன் யார்?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'மகாசேனன்', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'மகா பராக்கிரமபாகு (Parakramabahu I)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'விஜயபாகு', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'துட்டகைமுனு', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'பராக்கிரம சமுத்திரத்தை உருவாக்கிய மன்னன்.',
        explanation: 'மகா பராக்கிரமபாகு மன்னன் விவசாயத்திற்கும் நீர்ப்பாசனத்திற்கும் உலகப் புகழ்பெற்ற இக்கோட்பாட்டை உரைத்தார்.',
      },
    ],
  },
  // 22. Badulla
  {
    id: 'badulla',
    levelNumber: 22,
    nameEn: 'Badulla',
    nameTa: 'பதுளை',
    nameSi: 'බදුල්ල',
    provinceEn: 'Uva Province',
    provinceTa: 'ஊவா மாகாணம்',
    icon: '🚂',
    gradeSubject: 'தரம் 9 • புவியியல் & புகையிரதப் பாதை',
    gradeSubjectEn: 'Grade 9 • Geography & Railway Wonders',
    descriptionTa: 'ஒன்பது வளைவுப் பாலம் (Nine Arches Bridge), துன்ஹிந்த நீர்வீழ்ச்சி மற்றும் எல்ல சுற்றுலா மையம்.',
    descriptionEn: 'Nine Arch Demodara railway bridge, Dunhinda falls, and Ella tourism paradise.',
    defaultPoints: 135,
    initialQuestions: [
      {
        id: 'q_bad_1',
        questionText: 'எந்தவித உருக்கு இரும்பும் பயன்படுத்தப்படாமல் முழுதும் செங்கல் கற்களால் கட்டப்பட்ட இலங்கையின் புகழ்பெற்ற பாலம் எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'விக்டோரியா அணைப் பாலம்', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'தெமோதரை ஒன்பது வளைவுப் பாலம் (Nine Arch Bridge)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'களனி புதிய பாலம்', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'கிண்ணியா பாலம்', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'எல்ல – தெமோதரை இடையே அமைந்த ரயில்வே அதிசயம்.',
        explanation: 'ஒன்பது வளைவுப் பாலம் முழுமையாக கருங்கல் மற்றும் செங்கற்களால் மட்டுமே கட்டப்பட்ட பிரித்தானிய காலப் பொறியியல் விந்தை.',
      },
    ],
  },
  // 23. Monaragala
  {
    id: 'monaragala',
    levelNumber: 23,
    nameEn: 'Monaragala',
    nameTa: 'மொனராகலை',
    nameSi: 'මොනරාගල',
    provinceEn: 'Uva Province',
    provinceTa: 'ஊவா மாகாணம்',
    icon: '🏺',
    gradeSubject: 'தரம் 8 • வரலாறு & மரபுரிமை',
    gradeSubjectEn: 'Grade 8 • Ancient Rock Relics',
    descriptionTa: 'மாலிகாவில மாபெரும் கற்சிலை, புத்தம கடோட்ட குகை விகாரை மற்றும் விவசாய காடுகள்.',
    descriptionEn: 'Tallest free-standing Buddha statue at Maligawila and historic relics.',
    defaultPoints: 120,
    initialQuestions: [
      {
        id: 'q_mon_1',
        questionText: 'இலங்கையில் ஒரே சுண்ணாம்புக் கற்பாறையில் தனியாகச் செதுக்கப்பட்ட மிக உயரமான நின்ற கோல சிலை எங்குள்ளது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'அவுக்கண', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'மாலிகாவில (Maligawila - மொனராகலை)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'பொலன்னறுவை கல் விகாரை', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'தம்புள்ளை', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: '11 மீட்டருக்கும் அதிக உயரமுடைய சிலை.',
        explanation: 'மாலிகாவில சிலை இலங்கையின் மிகப்பெரிய தனித்து நிற்கும் நின்ற நிலை புத்தர் சிலையாகும்.',
      },
    ],
  },
  // 24. Ratnapura
  {
    id: 'ratnapura',
    levelNumber: 24,
    nameEn: 'Ratnapura',
    nameTa: 'இரத்தினபுரி',
    nameSi: 'රත්නපුර',
    provinceEn: 'Sabaragamuwa Province',
    provinceTa: 'சப்ரகமுவ மாகாணம்',
    icon: '💎',
    gradeSubject: 'தரம் 10 • புவியியல் & கனிம வளம்',
    gradeSubjectEn: 'Grade 10 • Gemology & Biodiversity',
    descriptionTa: 'இரத்தினக் கற்களின் நகரம், சிவனொளிபாதமலை பிரதான பாதை மற்றும் சிங்கராஜ மழைக்காடு.',
    descriptionEn: 'City of gems, Adam’s Peak route, and Sinharaja Biosphere Reserve.',
    defaultPoints: 145,
    initialQuestions: [
      {
        id: 'q_rat_1',
        questionText: 'யுனெஸ்கோவினால் உலக இயற்கை பாரம்பரியக் காடாகப் பிரகடனப்படுத்தப்பட்ட இலங்கையின் முதன்மை மழைக்காடு எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'சிங்கராஜ மழைக்காடு (Sinharaja Rainforest)', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'கன்னெலிய காடு', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'நக்கிள்ஸ் காடு', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'ரிதிகம', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 0,
        hint: 'அரிதான பல உள்ளூர் தாவர மற்றும் விலங்கினங்களின் புகலிடம்.',
        explanation: 'சிங்கராஜ மழைக்காடு உலகப் புகழ்பெற்ற இலங்கையின் அயனமண்டல கன்னி மழைக்காடாகும்.',
      },
    ],
  },
  // 25. Kegalle
  {
    id: 'kegalle',
    levelNumber: 25,
    nameEn: 'Kegalle',
    nameTa: 'கேகாலை',
    nameSi: 'කෑගල්ල',
    provinceEn: 'Sabaragamuwa Province',
    provinceTa: 'சப்ரகமுவ மாகாணம்',
    icon: '🐘',
    gradeSubject: 'தரம் 8 • விலங்கியல் & வரலாற்று குகைகள்',
    gradeSubjectEn: 'Grade 8 • Zoology & Prehistoric Caves',
    descriptionTa: 'பின்னவல யானைகள் புகலிடம், பஹியன்கல குகை மற்றும் பெலிலென வரலாற்று மனித எச்சங்கள்.',
    descriptionEn: 'Pinnawala Elephant Orphanage and prehistoric Belilena cave dwellings.',
    defaultPoints: 150,
    initialQuestions: [
      {
        id: 'q_keg_1',
        questionText: 'தாயை இழந்த குட்டி யானைகளைப் பராமரிக்கும் உலகின் முதன்மையான அநாதை இல்லம் அமைந்துள்ள இடம் எது?',
        options: [
          { shape: 'triangle', symbol: '▲', text: 'உடவளவ', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
          { shape: 'square', symbol: '■', text: 'பின்னவல (Pinnawala - கேகாலை)', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
          { shape: 'circle', symbol: '●', text: 'யால', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
          { shape: 'diamond', symbol: '♦', text: 'தெஹிவளை', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
        ],
        correctIndex: 1,
        hint: 'மகா ஓயா ஆற்றங்கரையில் யானைகள் குளிப்பாட்டப்படும் காட்சி புகழ்பெற்றது.',
        explanation: 'பின்னவல யானைகள் இல்லம் 1975 இல் நிறுவப்பட்ட சர்வதேச புகழ்பெற்ற யானைகள் காப்பகமாகும்.',
      },
    ],
  },
];

export const DISTRICT_QUEST_STORAGE_KEY = 'hnc_edu_arena_25_districts_v2';

export function getDistrictById(districtId: string): SriLankaDistrictInfo | undefined {
  return SRI_LANKA_25_DISTRICTS.find((d) => d.id === districtId);
}

export function getAllDistrictsList(): { id: string; nameEn: string; nameTa: string; provinceTa: string }[] {
  return SRI_LANKA_25_DISTRICTS.map((d) => ({
    id: d.id,
    nameEn: d.nameEn,
    nameTa: d.nameTa,
    provinceTa: d.provinceTa,
  }));
}

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Trash2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ListOrdered,
  Image as ImageIcon,
  Check,
  Scale,
  MessageSquare,
  Filter,
  Eye,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { QuestionItem, QuestionType, CompetitionType } from '../../types';

interface BulkQuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (newQuestions: QuestionItem[], mode: 'append' | 'replace', suggestedTitle?: string) => void;
  existingCount: number;
  currentLanguage?: string;
  defaultMarks?: number;
  competitionType?: CompetitionType;
}

export const BulkQuestionImportModal: React.FC<BulkQuestionImportModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
  existingCount,
  currentLanguage = 'ta',
  defaultMarks = 2,
  competitionType = 'Competition',
}) => {
  const [activeMode, setActiveMode] = useState<'excel' | 'text'>('excel');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<QuestionItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'all' | QuestionType>('all');

  // Helper to normalize keys from Excel rows preserving unicode Tamil/Sinhala letters
  const normalizeKey = (key: string): string => {
    return key.toLowerCase().trim().replace(/[\s_\-\(\)\[\]:.,\/\\]+/g, '');
  };

  // Download Sample Excel / CSV Template covering all 4 Question Types
  const handleDownloadSample = (format: 'xlsx' | 'csv') => {
    const sampleData = [
      {
        'Question Type (வினா வகை)': 'multiple_choice',
        'Question Text (வினா)': 'What is the capital of Sri Lanka?',
        'Image URL (பட இணைப்பு)': '',
        'Option A (தெரிவு A)': 'Colombo',
        'Option B (தெரிவு B)': 'Sri Jayawardenepura Kotte',
        'Option C (தெரிவு C)': 'Kandy',
        'Option D (தெரிவு D)': 'Galle',
        'Correct Answer (சரியான விடை)': 'B',
        'Marks (மதிப்பெண்)': 2,
        'Explanation (விளக்கம்)': 'Sri Jayawardenepura Kotte is the administrative capital.',
      },
      {
        'Question Type (வினா வகை)': 'true_false',
        'Question Text (வினா)': 'The chemical symbol for water is H2O.',
        'Image URL (பட இணைப்பு)': '',
        'Option A (தெரிவு A)': 'True',
        'Option B (தெரிவு B)': 'False',
        'Option C (தெரிவு C)': '',
        'Option D (தெரிவு D)': '',
        'Correct Answer (சரியான விடை)': 'True',
        'Marks (மதிப்பெண்)': 2,
        'Explanation (விளக்கம்)': 'Water consists of 2 Hydrogen atoms and 1 Oxygen atom.',
      },
      {
        'Question Type (வினா வகை)': 'short_answer',
        'Question Text (வினா)': 'What is the chemical formula for table salt?',
        'Image URL (பட இணைப்பு)': '',
        'Option A (தெரிவு A)': '',
        'Option B (தெரிவு B)': '',
        'Option C (தெரிவு C)': '',
        'Option D (தெரிவு D)': '',
        'Correct Answer (சரியான விடை)': 'NaCl',
        'Marks (மதிப்பெண்)': 5,
        'Explanation (விளக்கம்)': 'Sodium Chloride (NaCl) is common table salt.',
      },
      {
        'Question Type (வினா வகை)': 'picture_question',
        'Question Text (வினா)': 'Identify the world heritage monument shown in the photograph.',
        'Image URL (பட இணைப்பு)': 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80',
        'Option A (தெரிவு A)': 'Sigiriya (Lion Rock)',
        'Option B (தெரிவு B)': 'Galle Dutch Fort',
        'Option C (தெரிவு C)': 'Dambulla Cave Temple',
        'Option D (தெரிவு D)': 'Polonnaruwa Vatadage',
        'Correct Answer (சரியான விடை)': 'A',
        'Marks (மதிப்பெண்)': 5,
        'Explanation (விளக்கம்)': 'Sigiriya is an ancient rock fortress located in the Matale District.',
      },
      {
        'Question Type (வினா வகை)': 'true_false',
        'Question Text (வினா)': 'இலங்கையின் தேசிய மலர் தாமரை ஆகும்.',
        'Image URL (பட இணைப்பு)': '',
        'Option A (தெரிவு A)': 'சரி (True)',
        'Option B (தெரிவு B)': 'தவறு (False)',
        'Option C (தெரிவு C)': '',
        'Option D (தெரிவு D)': '',
        'Correct Answer (சரியான விடை)': 'தவறு (False)',
        'Marks (மதிப்பெண்)': 2,
        'Explanation (விளக்கம்)': 'இலங்கையின் தேசிய மலர் நீலோற்பலம் ஆகும்.',
      },
      {
        'Question Type (வினா வகை)': 'short_answer',
        'Question Text (வினா)': 'மனித உடலின் மிகப்பெரிய உள்ளுறுப்பு எது?',
        'Image URL (பட இணைப்பு)': '',
        'Option A (தெரிவு A)': '',
        'Option B (தெரிவு B)': '',
        'Option C (தெரிவு C)': '',
        'Option D (தெரிவு D)': '',
        'Correct Answer (சரியான விடை)': 'ஈரல் (Liver)',
        'Marks (மதிப்பெண்)': 5,
        'Explanation (விளக்கம்)': 'ஈரல் மனித உடலின் மிகப்பெரிய உள்ளுறுப்பாகும்.',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 22 }, // Question Type
      { wch: 45 }, // Question Text
      { wch: 35 }, // Image URL
      { wch: 22 }, // Option A
      { wch: 22 }, // Option B
      { wch: 22 }, // Option C
      { wch: 22 }, // Option D
      { wch: 22 }, // Correct Answer
      { wch: 12 }, // Marks
      { wch: 35 }, // Explanation
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions_Template');

    const downloadFileName = `${competitionType}_Questions_Template.${format}`;
    if (format === 'xlsx') {
      XLSX.writeFile(wb, downloadFileName);
    } else {
      XLSX.writeFile(wb, downloadFileName);
    }
  };

  // Parse Text Lines directly into Questions with support for Quiz, True/False, Short Answer, & Picture
  const parseRawTextString = (text: string, baseOrder: number): QuestionItem[] => {
    const lines = text.split('\n');
    const items: QuestionItem[] = [];

    let currentQText = '';
    let currentQType: QuestionType | null = null;
    let currentImageUrl = '';
    let currentOptions: string[] = [];
    let currentCorrect = '';
    let currentMarks = defaultMarks;
    let currentExplanation = '';

    const commitCurrentQuestion = () => {
      if (currentQText.trim()) {
        // Determine Question Type
        let resolvedType: QuestionType = 'multiple_choice';

        if (currentQType) {
          resolvedType = currentQType;
        } else if (currentImageUrl) {
          resolvedType = 'picture_question';
        } else if (
          currentOptions.length === 2 &&
          (
            (currentOptions[0].toLowerCase().includes('true') && currentOptions[1].toLowerCase().includes('false')) ||
            (currentOptions[0].includes('சரி') && currentOptions[1].includes('தவறு')) ||
            (currentOptions[0].includes('உண்மை') && currentOptions[1].includes('பொய்')) ||
            (currentOptions[0].toLowerCase().includes('yes') && currentOptions[1].toLowerCase().includes('no'))
          )
        ) {
          resolvedType = 'true_false';
        } else if (
          currentOptions.length === 0 &&
          (
            currentCorrect.toLowerCase() === 'true' ||
            currentCorrect.toLowerCase() === 'false' ||
            currentCorrect.includes('சரி') ||
            currentCorrect.includes('தவறு')
          )
        ) {
          resolvedType = 'true_false';
        } else if (currentOptions.length === 0) {
          resolvedType = 'short_answer';
        } else {
          resolvedType = 'multiple_choice';
        }

        // Handle specific type requirements
        let finalOptions: string[] = [];
        let finalCorrect = currentCorrect.trim();

        if (resolvedType === 'true_false') {
          finalOptions = currentOptions.length === 2
            ? [...currentOptions]
            : (currentLanguage === 'ta' ? ['சரி (True)', 'தவறு (False)'] : ['True', 'False']);

          const normC = currentCorrect.trim().toUpperCase();
          if (normC === 'A' || normC === '1' || normC.includes('TRUE') || normC.includes('சரி')) {
            finalCorrect = finalOptions[0];
          } else if (normC === 'B' || normC === '2' || normC.includes('FALSE') || normC.includes('தவறு')) {
            finalCorrect = finalOptions[1];
          } else if (!finalCorrect) {
            finalCorrect = finalOptions[0];
          }
        } else if (resolvedType === 'short_answer') {
          finalOptions = [];
          finalCorrect = currentCorrect.trim();
        } else {
          // Multiple Choice or Picture Question
          finalOptions = [...currentOptions];
          let chosen = currentOptions[0] || '';
          const normCorrect = currentCorrect.trim().toUpperCase();

          if (normCorrect === 'A' || normCorrect === '1') {
            chosen = currentOptions[0] || chosen;
          } else if (normCorrect === 'B' || normCorrect === '2') {
            chosen = currentOptions[1] || chosen;
          } else if (normCorrect === 'C' || normCorrect === '3') {
            chosen = currentOptions[2] || chosen;
          } else if (normCorrect === 'D' || normCorrect === '4') {
            chosen = currentOptions[3] || chosen;
          } else if (currentOptions.some((o) => o.toLowerCase() === currentCorrect.toLowerCase())) {
            const match = currentOptions.find((o) => o.toLowerCase() === currentCorrect.toLowerCase());
            if (match) chosen = match;
          } else if (currentCorrect) {
            chosen = currentCorrect;
          }
          finalCorrect = chosen;
        }

        items.push({
          id: `q-bulk-${Date.now()}-${items.length + 1}`,
          type: resolvedType,
          questionText: currentQText.trim(),
          options: finalOptions,
          correctAnswer: finalCorrect,
          marks: currentMarks,
          order: baseOrder + items.length + 1,
          imageUrl: currentImageUrl.trim(),
          explanation: currentExplanation.trim(),
        });
      }

      currentQText = '';
      currentQType = null;
      currentImageUrl = '';
      currentOptions = [];
      currentCorrect = '';
      currentMarks = defaultMarks;
      currentExplanation = '';
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 1. Check for Question Type line: Type: True/False, Type: Short Answer, Type: Picture, Type: MCQ, Type: Exam, Type: Quiz
      const typeMatch = line.match(/^(?:Type|Question\s*Type|QType|வினா\s*வகை|வகை|ஆதாரம்|வර්ගය)[\s:=]+(.+)$/i);
      if (typeMatch) {
        const rawT = typeMatch[1].toLowerCase().trim().replace(/[\s_\-\/\\]+/g, '');
        if (
          rawT.includes('true') ||
          rawT.includes('false') ||
          rawT.includes('tf') ||
          rawT.includes('சரி') ||
          rawT.includes('தவறு') ||
          rawT.includes('உண்மை') ||
          rawT.includes('பொய்')
        ) {
          currentQType = 'true_false';
        } else if (
          rawT.includes('short') ||
          rawT.includes('text') ||
          rawT.includes('written') ||
          rawT.includes('essay') ||
          rawT.includes('blank') ||
          rawT.includes('குறுகிய') ||
          rawT.includes('சுருக்க') ||
          rawT.includes('எழுத்து')
        ) {
          currentQType = 'short_answer';
        } else if (
          rawT.includes('picture') ||
          rawT.includes('image') ||
          rawT.includes('photo') ||
          rawT.includes('diagram') ||
          rawT.includes('பட')
        ) {
          currentQType = 'picture_question';
        } else if (
          rawT.includes('multiple') ||
          rawT.includes('mcq') ||
          rawT.includes('quiz') ||
          rawT.includes('exam') ||
          rawT.includes('competition') ||
          rawT.includes('பல்தெரிவு') ||
          rawT.includes('தெரிவு')
        ) {
          currentQType = 'multiple_choice';
        }
        continue;
      }

      // 2. Check for Image URL line: Image: https://..., Picture: https://...
      const imgMatch = line.match(/^(?:Image|Image\s*URL|ImageUrl|Picture|Photo|Diagram|படம்|பட\s*இணைப்பு|புகைப்படம்|පින්තූරය)[\s:=]+(.+)$/i);
      if (imgMatch) {
        currentImageUrl = imgMatch[1].trim();
        if (!currentQType) currentQType = 'picture_question';
        continue;
      }

      // 3. Check for Explanation line: Explanation: ..., விளக்கம்: ...
      const expMatch = line.match(/^(?:Explanation|Explain|விளக்கம்|காரணம்|විස්තරය)[\s:=]+(.+)$/i);
      if (expMatch) {
        currentExplanation = expMatch[1].trim();
        continue;
      }

      // 4. Check if line is Answer / விடை / பதில் / Ans
      const ansMatch = line.match(/^(?:Answer|Ans|Correct|விடை|சரியான விடை|பதில்|පිළිතුර)[\s:=]+(.+)$/i);
      if (ansMatch) {
        currentCorrect = ansMatch[1].trim();
        continue;
      }

      // 5. Check if line is Marks / புள்ளிகள்
      const markMatch = line.match(/^(?:Marks|Mark|புள்ளிகள்|மதிப்பெண்|புள்ளி|Points|Pts|Score|ලකුණු)[\s:=]+(\d+(?:\.\d+)?)/i);
      if (markMatch) {
        currentMarks = parseFloat(markMatch[1]) || defaultMarks;
        continue;
      }

      // 6. Check if line is an Option: A), B., (C), 1), 2., etc.
      const optMatch = line.match(/^(?:[A-Da-d1-4][\.\)]|\([A-Da-d1-4]\))\s*(.+)$/);
      if (optMatch) {
        currentOptions.push(optMatch[1].trim());
        continue;
      }

      // 7. Check if line starts with question number: e.g. "1.", "1)", "Q1:", "வினா 1:"
      const qNumMatch = line.match(/^(?:Q\d+[\.:]?|\d+[\.:\)]|வினா\s*\d+[\.:]?|கேள்வி\s*\d+[\.:]?)\s*(.+)$/i);
      if (qNumMatch) {
        if (currentQText) {
          commitCurrentQuestion();
        }
        currentQText = qNumMatch[1].trim();
        continue;
      }

      // 8. Continuation line
      if (currentOptions.length === 0) {
        if (currentQText) {
          currentQText += ' ' + line;
        } else {
          currentQText = line;
        }
      } else {
        commitCurrentQuestion();
        currentQText = line;
      }
    }

    // Commit the last question
    if (currentQText) {
      commitCurrentQuestion();
    }

    return items;
  };

  // Parse Excel, CSV, JSON, or Text File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    const baseOrder = importMode === 'append' ? existingCount : 0;
    const lowerName = file.name.toLowerCase();

    // 1. Text or Markdown file (.txt, .md)
    if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = String(evt.target?.result || '');
          setRawText(content);
          const parsed = parseRawTextString(content, baseOrder);
          if (parsed.length === 0) {
            setErrorMessage(
              currentLanguage === 'ta'
                ? 'உரைக்கோப்பில் வினாக்கள் எதுவும் கண்டறியப்படவில்லை.'
                : 'No questions detected in the uploaded text file.'
            );
          } else {
            setParsedQuestions(parsed);
          }
        } catch (err: any) {
          setErrorMessage(err.message || 'Error parsing text file.');
        }
      };
      reader.readAsText(file);
      return;
    }

    // 2. JSON file (.json)
    if (lowerName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const raw = String(evt.target?.result || '');
          const data = JSON.parse(raw);
          const rawArray: any[] = Array.isArray(data) ? data : data.questions || [];

          if (rawArray.length === 0) {
            setErrorMessage('JSON file contains no questions array.');
            return;
          }

          const items: QuestionItem[] = rawArray.map((row, idx) => {
            const rawImg = String(row.imageUrl || row.image || row.picture || '').trim();
            const rawType = String(row.type || '').trim().toLowerCase();

            let qType: QuestionType = 'multiple_choice';
            if (rawType === 'true_false' || rawType.includes('true')) {
              qType = 'true_false';
            } else if (rawType === 'short_answer' || rawType.includes('short')) {
              qType = 'short_answer';
            } else if (rawType === 'picture_question' || rawType.includes('picture') || rawImg) {
              qType = 'picture_question';
            } else if (Array.isArray(row.options) && row.options.length > 0) {
              qType = 'multiple_choice';
            } else {
              qType = 'short_answer';
            }

            return {
              id: `q-json-${Date.now()}-${idx + 1}`,
              type: qType,
              questionText: String(row.questionText || row.question || row.text || row.வினா || '').trim(),
              options: Array.isArray(row.options) ? row.options.map((o: any) => String(o).trim()) : [],
              correctAnswer: String(row.correctAnswer || row.answer || row.விடை || '').trim(),
              marks: typeof row.marks === 'number' ? row.marks : defaultMarks,
              order: baseOrder + idx + 1,
              imageUrl: rawImg,
              explanation: String(row.explanation || row.விளக்கம் || '').trim(),
            };
          });

          setParsedQuestions(items);
        } catch (err: any) {
          setErrorMessage('Invalid JSON format: ' + err.message);
        }
      };
      reader.readAsText(file);
      return;
    }

    // 3. Excel or CSV Spreadsheet (.xlsx, .xls, .csv, .tsv)
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows || rows.length === 0) {
          setErrorMessage(
            currentLanguage === 'ta'
              ? 'கோப்பில் வினாக்கள் எதுவும் கண்டறியப்படவில்லை.'
              : 'No data rows found in the uploaded file.'
          );
          return;
        }

        const items: QuestionItem[] = [];

        rows.forEach((row, idx) => {
          let qText = '';
          let qTypeRaw = '';
          let qImageUrl = '';
          let optA = '';
          let optB = '';
          let optC = '';
          let optD = '';
          let correct = '';
          let marks = defaultMarks;
          let explanation = '';

          for (const rawKey of Object.keys(row)) {
            const val = String(row[rawKey] || '').trim();
            const norm = normalizeKey(rawKey);

            // Question Type Detection
            if (
              norm === 'type' ||
              norm === 'qtype' ||
              norm === 'questiontype' ||
              norm.includes('questiontype') ||
              norm.includes('வினாவகை') ||
              norm.includes('வகை') ||
              norm.includes('format') ||
              norm.includes('mode')
            ) {
              qTypeRaw = val;
            } else if (
              // Image URL Detection
              norm === 'image' ||
              norm === 'imageurl' ||
              norm === 'img' ||
              norm === 'picture' ||
              norm === 'pictureurl' ||
              norm === 'photo' ||
              norm === 'photourl' ||
              norm === 'diagram' ||
              norm.includes('image') ||
              norm.includes('picture') ||
              norm.includes('photo') ||
              norm.includes('diagram') ||
              norm.includes('media') ||
              norm.includes('படஇணைப்பு') ||
              norm.includes('புகைப்படம்') ||
              norm.includes('படம்')
            ) {
              qImageUrl = val;
            } else if (
              // Question Prompt Detection
              norm.includes('question') ||
              norm.includes('text') ||
              norm.includes('qtext') ||
              norm.includes('vina') ||
              norm.includes('kelvi') ||
              norm.includes('வினா') ||
              norm.includes('கேள்வி') ||
              norm === 'q' ||
              norm === 'prompt'
            ) {
              qText = val;
            } else if (
              // Option A
              norm.includes('optiona') ||
              norm.includes('option1') ||
              norm.includes('தெரிவுa') ||
              norm.includes('தெரிவு1') ||
              norm.includes('விருப்பம்a') ||
              norm.includes('விருப்பம்1') ||
              norm === 'a' ||
              norm === 'opta' ||
              norm === 'opt1'
            ) {
              optA = val;
            } else if (
              // Option B
              norm.includes('optionb') ||
              norm.includes('option2') ||
              norm.includes('தெரிவுb') ||
              norm.includes('தெரிவு2') ||
              norm.includes('விருப்பம்b') ||
              norm.includes('விருப்பம்2') ||
              norm === 'b' ||
              norm === 'optb' ||
              norm === 'opt2'
            ) {
              optB = val;
            } else if (
              // Option C
              norm.includes('optionc') ||
              norm.includes('option3') ||
              norm.includes('தெரிவுc') ||
              norm.includes('தெரிவு3') ||
              norm.includes('விருப்பம்c') ||
              norm.includes('விருப்பம்3') ||
              norm === 'c' ||
              norm === 'optc' ||
              norm === 'opt3'
            ) {
              optC = val;
            } else if (
              // Option D
              norm.includes('optiond') ||
              norm.includes('option4') ||
              norm.includes('தெரிவுd') ||
              norm.includes('தெரிவு4') ||
              norm.includes('விருப்பம்d') ||
              norm.includes('விருப்பம்4') ||
              norm === 'd' ||
              norm === 'optd' ||
              norm === 'opt4'
            ) {
              optD = val;
            } else if (
              // Correct Answer
              norm.includes('correct') ||
              norm.includes('answer') ||
              norm.includes('ans') ||
              norm.includes('விடை') ||
              norm.includes('பதில்') ||
              norm.includes('சரியானவிடை') ||
              norm.includes('vidai') ||
              norm === 'key' ||
              norm.includes('solution') ||
              norm.includes('model') ||
              norm.includes('expected')
            ) {
              correct = val;
            } else if (
              // Marks
              norm.includes('mark') ||
              norm.includes('point') ||
              norm.includes('மதிப்பெண்') ||
              norm.includes('புள்ளிகள்') ||
              norm.includes('புள்ளி') ||
              norm.includes('score') ||
              norm.includes('pts')
            ) {
              const parsedMark = parseFloat(val);
              if (!isNaN(parsedMark) && parsedMark > 0) marks = parsedMark;
            } else if (
              // Explanation
              norm.includes('explanation') ||
              norm.includes('விளக்கம்') ||
              norm.includes('reason') ||
              norm.includes('notes')
            ) {
              explanation = val;
            }
          }

          // Fallback if positional without headers
          if (!qText && Object.values(row).length >= 2) {
            const vals = Object.values(row).map((v) => String(v || '').trim());
            qText = vals[0];
            optA = vals[1] || '';
            optB = vals[2] || '';
            optC = vals[3] || '';
            optD = vals[4] || '';
            correct = vals[5] || '';
          }

          if (qText) {
            // Intelligent Question Type Detection
            let detectedType: QuestionType = 'multiple_choice';
            const normType = qTypeRaw.toLowerCase().trim().replace(/[\s_\-\/\\]+/g, '');

            if (
              normType.includes('truefalse') ||
              normType.includes('true') ||
              normType.includes('false') ||
              normType.includes('tf') ||
              normType.includes('சரியாதவறா') ||
              normType.includes('சரி') ||
              normType.includes('தவறு') ||
              normType.includes('உண்மை') ||
              normType.includes('பொய்')
            ) {
              detectedType = 'true_false';
            } else if (
              normType.includes('short') ||
              normType.includes('text') ||
              normType.includes('written') ||
              normType.includes('essay') ||
              normType.includes('blank') ||
              normType.includes('open') ||
              normType.includes('குறுகிய') ||
              normType.includes('சுருக்க') ||
              normType.includes('எழுத்து')
            ) {
              detectedType = 'short_answer';
            } else if (
              normType.includes('picture') ||
              normType.includes('image') ||
              normType.includes('photo') ||
              normType.includes('diagram') ||
              normType.includes('பட') ||
              normType.includes('புகைப்பட')
            ) {
              detectedType = 'picture_question';
            } else if (
              normType.includes('multiple') ||
              normType.includes('mcq') ||
              normType.includes('quiz') ||
              normType.includes('exam') ||
              normType.includes('competition') ||
              normType.includes('பல்தெரிவு') ||
              normType.includes('தெரிவு')
            ) {
              detectedType = 'multiple_choice';
            } else {
              // Auto-detect based on row fields if Question Type column was not specified or had competition name
              if (qImageUrl) {
                detectedType = 'picture_question';
              } else if (
                (optA && optB && !optC && !optD && (
                  (optA.toLowerCase().includes('true') && optB.toLowerCase().includes('false')) ||
                  (optA.includes('சரி') && optB.includes('தவறு')) ||
                  (optA.includes('உண்மை') && optB.includes('பொய்')) ||
                  (optA.toLowerCase().includes('yes') && optB.toLowerCase().includes('no'))
                )) ||
                (!optA && !optB && !optC && !optD && (
                  correct.toLowerCase() === 'true' || correct.toLowerCase() === 'false' ||
                  correct.includes('சரி') || correct.includes('தவறு')
                ))
              ) {
                detectedType = 'true_false';
              } else if (!optA && !optB && !optC && !optD) {
                detectedType = 'short_answer';
              } else {
                detectedType = 'multiple_choice';
              }
            }

            // Prepare options and correct answer based on resolved type
            let finalOptions: string[] = [];
            let finalCorrect = correct;

            if (detectedType === 'true_false') {
              finalOptions = (optA && optB)
                ? [optA, optB]
                : (currentLanguage === 'ta' ? ['சரி (True)', 'தவறு (False)'] : ['True', 'False']);

              const normC = correct.toUpperCase().trim();
              if (normC === 'A' || normC === '1' || normC.includes('TRUE') || normC.includes('சரி')) {
                finalCorrect = finalOptions[0];
              } else if (normC === 'B' || normC === '2' || normC.includes('FALSE') || normC.includes('தவறு')) {
                finalCorrect = finalOptions[1];
              } else if (!finalCorrect) {
                finalCorrect = finalOptions[0];
              }
            } else if (detectedType === 'short_answer') {
              finalOptions = [];
              finalCorrect = correct;
            } else {
              // Multiple Choice or Picture Question
              const rawOpts = [optA, optB, optC, optD].filter(Boolean);
              finalOptions = rawOpts.length > 0 ? rawOpts : [];

              let chosen = finalOptions[0] || correct;
              const normC = correct.toUpperCase().trim();

              if (normC === 'A' || normC === '1' || normC === 'OPTION A') {
                chosen = finalOptions[0] || chosen;
              } else if (normC === 'B' || normC === '2' || normC === 'OPTION B') {
                chosen = finalOptions[1] || chosen;
              } else if (normC === 'C' || normC === '3' || normC === 'OPTION C') {
                chosen = finalOptions[2] || chosen;
              } else if (normC === 'D' || normC === '4' || normC === 'OPTION D') {
                chosen = finalOptions[3] || chosen;
              } else if (finalOptions.includes(correct)) {
                chosen = correct;
              }
              finalCorrect = chosen;
            }

            items.push({
              id: `q-bulk-${Date.now()}-${idx + 1}`,
              type: detectedType,
              questionText: qText,
              options: finalOptions,
              correctAnswer: finalCorrect,
              marks: marks,
              order: baseOrder + idx + 1,
              imageUrl: qImageUrl,
              explanation: explanation,
            });
          }
        });

        if (items.length === 0) {
          setErrorMessage(
            currentLanguage === 'ta'
              ? 'படிவத்தில் சரியான வினா வடிவமைப்பு கிடைக்கவில்லை. மாதிரி டெம்ப்ளேட்டை பதிவிறக்கம் செய்து சோதிக்கவும்.'
              : 'Could not detect question rows. Please use the sample template for reference.'
          );
        } else {
          setParsedQuestions(items);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMessage(
          currentLanguage === 'ta'
            ? 'கோப்பை வாசிப்பதில் பிழை ஏற்பட்டது. தயவுசெய்து சரியான .xlsx அல்லது .csv கோப்பை தேர்வு செய்யவும்.'
            : 'Error reading file. Please upload a valid .xlsx or .csv file.'
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  // Parse Raw Text / Word Copy-Paste
  const handleParseText = () => {
    if (!rawText.trim()) {
      setErrorMessage(
        currentLanguage === 'ta'
          ? 'தயவுசெய்து வினாக்களை தட்டச்சு அல்லது ஒட்டவும் (Paste).'
          : 'Please enter or paste question text.'
      );
      return;
    }

    setErrorMessage(null);
    const baseOrder = importMode === 'append' ? existingCount : 0;
    const items = parseRawTextString(rawText, baseOrder);

    if (items.length === 0) {
      setErrorMessage(
        currentLanguage === 'ta'
          ? 'வினாக்களைப் பிரித்தெடுக்க முடியவில்லை. மாதிரி வடிவத்தை சோதிக்கவும்.'
          : 'Could not parse questions. Please check the sample format.'
      );
    } else {
      setParsedQuestions(items);
    }
  };

  // Insert Comprehensive Sample Text Demonstrating All 4 Question Types
  const handleInsertSampleText = () => {
    const sample = `1. Type: Multiple Choice
Which gas is most abundant in the Earth's atmosphere?
A) Oxygen
B) Nitrogen
C) Carbon Dioxide
D) Hydrogen
Answer: B
Marks: 2
Explanation: Nitrogen makes up approximately 78% of Earth's atmosphere.

2. Type: True / False
The chemical symbol for water is H2O.
A) True
B) False
Answer: True
Marks: 2
Explanation: Water consists of two Hydrogen atoms and one Oxygen atom.

3. Type: Short Answer
What is the chemical formula for table salt?
Answer: NaCl
Marks: 5
Explanation: Sodium Chloride (NaCl) is common table salt.

4. Type: Picture Question
Image: https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80
Identify the ancient rock fortress shown in the photograph:
A) Sigiriya Fortress
B) Galle Fort
C) Dambulla Cave Temple
D) Polonnaruwa Vatadage
Answer: A
Marks: 5
Explanation: Sigiriya is an ancient palace located in the Matale District.

5. வகை: சரியா தவறா
இலங்கையின் தேசிய மலர் தாமரை ஆகும்.
A) சரி
B) தவறு
விடை: தவறு
Marks: 2
விளக்கம்: இலங்கையின் தேசிய மலர் நீலோற்பலம் ஆகும்.

6. வகை: குறுகிய விடை
மனித உடலின் மிகப்பெரிய உள்ளுறுப்பு எது?
விடை: ஈரல் (Liver)
Marks: 5
விளக்கம்: ஈரல் மனித உடலின் மிகப்பெரிய உள்ளுறுப்பாகும்.`;

    setRawText(sample);
  };

  // Helper to change parsed question type directly in the preview
  const handleUpdateParsedQuestionType = (index: number, newType: QuestionType) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      target.type = newType;

      if (newType === 'true_false') {
        target.options = currentLanguage === 'ta' ? ['சரி (True)', 'தவறு (False)'] : ['True', 'False'];
        target.correctAnswer = target.options[0];
      } else if (newType === 'short_answer') {
        target.options = [];
      } else if (newType === 'multiple_choice' || newType === 'picture_question') {
        if (!target.options || target.options.length < 2) {
          target.options = ['Option A', 'Option B', 'Option C', 'Option D'];
          target.correctAnswer = target.options[0];
        }
      }

      copy[index] = target;
      return copy;
    });
  };

  const handleUpdateParsedImageUrl = (index: number, newUrl: string) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], imageUrl: newUrl, type: newUrl ? 'picture_question' : copy[index].type };
      return copy;
    });
  };

  const handleUpdateParsedCorrectAnswer = (index: number, newAns: string) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], correctAnswer: newAns };
      return copy;
    });
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (parsedQuestions.length === 0) return;
    const cleanSuggestedTitle = fileName
      ? fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim()
      : undefined;
    onImportQuestions(parsedQuestions, importMode, cleanSuggestedTitle);
    onClose();
  };

  // Filtered view in preview list
  const filteredParsedQuestions = previewFilter === 'all'
    ? parsedQuestions
    : parsedQuestions.filter((q) => q.type === previewFilter);

  const mcqCount = parsedQuestions.filter((q) => q.type === 'multiple_choice').length;
  const tfCount = parsedQuestions.filter((q) => q.type === 'true_false').length;
  const saCount = parsedQuestions.filter((q) => q.type === 'short_answer').length;
  const picCount = parsedQuestions.filter((q) => q.type === 'picture_question').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      preventBackdropClose={true}
      maxWidthClass="max-w-4xl"
      title={
        currentLanguage === 'ta'
          ? `வினாத்தாள் மொத்தப் பதிவேற்றம் (${competitionType} Bulk Upload)`
          : `Bulk Upload Question Paper for ${competitionType}`
      }
    >
      <div className="space-y-4 max-h-[82vh] overflow-y-auto pr-1 text-slate-800">
        {/* Banner with All 4 Supported Question Types */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-black uppercase tracking-wider border border-blue-400/40">
                {competitionType} Studio
              </span>
              <span className="font-extrabold text-white text-sm">
                {currentLanguage === 'ta'
                  ? '4 வகையான வினாக்களும் முழுமையாக ஆதரிக்கப்படுகின்றன'
                  : 'All 4 Question Types Supported in Bulk Upload'}
              </span>
            </div>
            <p className="text-[11px] text-blue-200/90 leading-relaxed">
              {currentLanguage === 'ta'
                ? 'Multiple Choice (Quiz / பல்தெரிவு), True/False (சரியா/தவறா), Short Answer (குறுகிய விடை) மற்றும் Picture Questions (பட வினாக்கள்) அனைத்தையும் ஒரே கோப்பில் பதிவேற்றலாம்.'
                : 'Upload Multiple Choice (Quiz MCQ), True/False, Short Answer, and Picture Questions with Image URLs all together.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <span className="px-2 py-1 rounded-lg bg-white/10 text-white text-[10px] font-bold border border-white/20">
              📝 Quiz MCQ
            </span>
            <span className="px-2 py-1 rounded-lg bg-white/10 text-white text-[10px] font-bold border border-white/20">
              ⚖️ True / False
            </span>
            <span className="px-2 py-1 rounded-lg bg-white/10 text-white text-[10px] font-bold border border-white/20">
              ✍️ Short Answer
            </span>
            <span className="px-2 py-1 rounded-lg bg-white/10 text-white text-[10px] font-bold border border-white/20">
              🖼️ Picture
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveMode('excel');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                activeMode === 'excel'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'ta' ? 'Excel / CSV கோப்பு' : 'Excel / CSV File'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('text');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                activeMode === 'text'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'ta' ? 'Text / Word ஒட்டுதல் (Copy-Paste)' : 'Copy-Paste Text'}</span>
            </button>
          </div>

          {existingCount > 0 && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition cursor-pointer ${
                  importMode === 'replace'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={currentLanguage === 'ta' ? 'முந்தைய வினாக்களை நீக்கி புதிய வினாத்தாளாக மாற்றுக' : 'Replace all existing questions'}
              >
                {currentLanguage === 'ta' ? '🔄 புதிய வினாத்தாள் (Replace)' : '🔄 Replace Existing'}
              </button>
              <button
                type="button"
                onClick={() => setImportMode('append')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition cursor-pointer ${
                  importMode === 'append'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={currentLanguage === 'ta' ? 'ஏற்கனவே உள்ளவற்றுடன் சேர்க்க' : 'Add to existing questions'}
              >
                {currentLanguage === 'ta' ? `➕ சேர்க்க (+${existingCount})` : `➕ Append (+${existingCount})`}
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: EXCEL / CSV / JSON / TXT UPLOAD */}
        {activeMode === 'excel' && (
          <div className="space-y-3">
            {/* Guide & Sample Template Download Bar */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 text-xs">
                <p className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {currentLanguage === 'ta'
                      ? 'அனைத்து வினா வகைகளுக்கான Excel மாதிரி டெம்ப்ளேட் (Download Template):'
                      : 'Sample Excel Template with All 4 Question Types:'}
                  </span>
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  {currentLanguage === 'ta'
                    ? 'தலைப்புகள்: Question Type, Question Text, Image URL, Option A, Option B, Option C, Option D, Correct Answer, Marks, Explanation.'
                    : 'Columns: Question Type, Question Text, Image URL, Option A, Option B, Option C, Option D, Correct Answer, Marks, Explanation.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadSample('xlsx')}
                  className="px-3 py-1.5 bg-white border border-blue-300 text-blue-900 rounded-lg text-xs font-bold hover:bg-blue-100/60 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Download complete .xlsx template with multiple choice, true/false, short answer & picture questions"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>.xlsx மாதிரி (All 4 Types)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSample('csv')}
                  className="px-3 py-1.5 bg-white border border-blue-300 text-blue-900 rounded-lg text-xs font-bold hover:bg-blue-100/60 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Download .csv template"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>.csv மாதிரி</span>
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/30 transition cursor-pointer">
              <input
                type="file"
                accept=".xlsx, .xls, .csv, .tsv, .txt, .json, .md"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-xs font-bold text-slate-800">
                {fileName
                  ? `தேர்ந்தெடுக்கப்பட்ட கோப்பு: ${fileName}`
                  : currentLanguage === 'ta'
                  ? 'Excel, CSV, Text அல்லது JSON கோப்பை இங்கே கிளிக் செய்து பதிவேற்றவும்'
                  : 'Click or drag & drop your .xlsx, .csv, .txt or .json file here'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {currentLanguage === 'ta'
                  ? 'ஆதரிக்கப்படும் வடிவங்கள்: Excel (.xlsx, .xls), CSV (.csv), உரை (.txt), JSON (.json)'
                  : 'Supports: Microsoft Excel (.xlsx, .xls), CSV (.csv), Text (.txt), JSON (.json)'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: COPY-PASTE TEXT PARSER */}
        {activeMode === 'text' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                {currentLanguage === 'ta'
                  ? 'வினாக்களை கீழே ஒட்டவும் (Type:, Image:, Answer: மற்றும் Marks: குறிப்பிடலாம்):'
                  : 'Paste questions text below (Supports Type:, Image:, Answer:, Marks:):'}
              </span>
              <button
                type="button"
                onClick={handleInsertSampleText}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'ta' ? 'மாதிரி உரையை நிரப்புக (4 வகையான மாதிரி)' : 'Fill Sample (All 4 Types)'}
                </span>
              </button>
            </div>

            <textarea
              rows={9}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`1. Type: Multiple Choice
What is the capital of Sri Lanka?
A) Colombo
B) Sri Jayawardenepura Kotte
C) Kandy
D) Galle
Answer: B
Marks: 2

2. Type: True / False
The chemical symbol for water is H2O.
Answer: True
Marks: 2

3. Type: Short Answer
What is the chemical formula for table salt?
Answer: NaCl
Marks: 5

4. Type: Picture Question
Image: https://images.unsplash.com/photo-1586861635167-e5223aadc9fe...
Identify this ancient rock fortress:
A) Sigiriya
B) Galle Fort
Answer: A
Marks: 5`}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParseText}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>{currentLanguage === 'ta' ? 'வினாக்களைப் பிரித்தெடு (Parse All Questions)' : 'Parse All Questions'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PARSED PREVIEW SECTION WITH QUESTION TYPE FILTER AND INLINE EDITING */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-900">
                  {currentLanguage === 'ta'
                    ? `${parsedQuestions.length} வினாக்கள் கண்டறியப்பட்டன (${competitionType}):`
                    : `${parsedQuestions.length} questions parsed for ${competitionType}:`}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Total Marks: {parsedQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)} pts
              </span>
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <span>வகை வடிகட்டி:</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  previewFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({parsedQuestions.length})
              </button>
              <button
                type="button"
                onClick={() => setPreviewFilter('multiple_choice')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  previewFilter === 'multiple_choice'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                <span>📝 Quiz / MCQ ({mcqCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewFilter('true_false')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  previewFilter === 'true_false'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                <span>⚖️ True / False ({tfCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewFilter('short_answer')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  previewFilter === 'short_answer'
                    ? 'bg-amber-700 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span>✍️ Short Answer ({saCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewFilter('picture_question')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  previewFilter === 'picture_question'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span>🖼️ Picture Question ({picCount})</span>
              </button>
            </div>

            {/* Scrollable Questions list */}
            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
              {filteredParsedQuestions.map((q, idx) => {
                const originalIndex = parsedQuestions.findIndex((item) => item.id === q.id);

                return (
                  <div
                    key={q.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs shadow-2xs hover:border-blue-300 transition"
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {originalIndex + 1}
                        </span>

                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-extrabold text-slate-900 leading-snug">{q.questionText}</p>

                          <div className="flex items-center gap-2 flex-wrap text-[10px]">
                            {/* Question Type Switcher */}
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-bold">வகை:</span>
                              <select
                                value={q.type}
                                onChange={(e) =>
                                  handleUpdateParsedQuestionType(originalIndex, e.target.value as QuestionType)
                                }
                                className="px-2 py-0.5 rounded-lg border border-slate-300 bg-slate-50 font-bold text-slate-800 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="multiple_choice">📝 Multiple Choice (Quiz)</option>
                                <option value="true_false">⚖️ True / False</option>
                                <option value="short_answer">✍️ Short Answer</option>
                                <option value="picture_question">🖼️ Picture Question</option>
                              </select>
                            </div>

                            <span className="text-slate-300">•</span>
                            <span className="font-bold text-blue-700">{q.marks} Marks</span>

                            {q.explanation && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500 truncate max-w-xs">
                                  💡 {q.explanation}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setParsedQuestions(parsedQuestions.filter((item) => item.id !== q.id))
                        }
                        className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer shrink-0"
                        title="Remove this question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Picture Question Thumbnail & Image URL edit */}
                    {(q.type === 'picture_question' || q.imageUrl) && (
                      <div className="pl-7 pt-1 flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        {q.imageUrl ? (
                          <div className="relative w-14 h-12 rounded-lg overflow-hidden bg-black border border-slate-300 shrink-0">
                            <img
                              src={q.imageUrl}
                              alt="Diagram"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-12 rounded-lg bg-amber-100 text-amber-800 font-bold text-[9px] flex items-center justify-center border border-amber-300 shrink-0 text-center p-1">
                            No Photo
                          </div>
                        )}
                        <div className="flex-1 w-full space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-blue-600" />
                            <span>பட இணைய முகவரி (Picture URL):</span>
                          </span>
                          <input
                            type="url"
                            placeholder="Enter image URL (https://...)"
                            value={q.imageUrl || ''}
                            onChange={(e) =>
                              handleUpdateParsedImageUrl(originalIndex, e.target.value)
                            }
                            className="w-full px-2 py-1 text-[11px] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* Type 1: True / False View */}
                    {q.type === 'true_false' && (
                      <div className="pl-7 flex items-center gap-2">
                        {(q.options && q.options.length === 2 ? q.options : ['True', 'False']).map((choice) => {
                          const isCorrect =
                            q.correctAnswer.toLowerCase() === choice.toLowerCase() ||
                            (choice.includes('True') && q.correctAnswer.toLowerCase() === 'true') ||
                            (choice.includes('False') && q.correctAnswer.toLowerCase() === 'false');

                          return (
                            <button
                              key={choice}
                              type="button"
                              onClick={() => handleUpdateParsedCorrectAnswer(originalIndex, choice)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {isCorrect && <Check className="w-3.5 h-3.5" />}
                              <span>{choice}</span>
                              {isCorrect && <span className="text-[10px] opacity-90">(Correct)</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Type 2: Short Answer View */}
                    {q.type === 'short_answer' && (
                      <div className="pl-7 flex items-center gap-2 bg-amber-50/60 p-2 rounded-xl border border-amber-200">
                        <span className="text-[11px] font-bold text-amber-900 shrink-0">
                          ✍️ எதிர்பார்க்கப்படும் விடை (Expected Answer):
                        </span>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={(e) =>
                            handleUpdateParsedCorrectAnswer(originalIndex, e.target.value)
                          }
                          placeholder="Enter model answer or keyword..."
                          className="flex-1 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}

                    {/* Type 3: Multiple Choice or Picture with Options View */}
                    {(q.type === 'multiple_choice' || (q.type === 'picture_question' && q.options && q.options.length > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-7">
                        {q.options?.map((opt, optIdx) => {
                          const isCorrect = q.correctAnswer === opt;
                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleUpdateParsedCorrectAnswer(originalIndex, opt)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 border transition cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-100/80 border-emerald-400 font-bold text-emerald-950 shadow-2xs ring-1 ring-emerald-400/40'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="font-mono text-[10px] text-slate-500 font-bold">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className="truncate flex-1">{opt}</span>
                              {isCorrect && (
                                <span className="ml-auto text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black">
                                  ✓ Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            {currentLanguage === 'ta' ? 'ரத்து செய்க' : 'Cancel'}
          </button>

          <button
            type="button"
            id="btn-confirm-bulk-import"
            onClick={handleConfirmImport}
            disabled={parsedQuestions.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <span>
              {currentLanguage === 'ta'
                ? `${parsedQuestions.length} வினாக்களை ${competitionType} வினாத்தாளில் சேர்க்க`
                : `Import ${parsedQuestions.length} Questions to ${competitionType}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

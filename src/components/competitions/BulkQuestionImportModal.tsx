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
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { QuestionItem } from '../../types';

interface BulkQuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (newQuestions: QuestionItem[], mode: 'append' | 'replace', suggestedTitle?: string) => void;
  existingCount: number;
  currentLanguage?: string;
  defaultMarks?: number;
}

export const BulkQuestionImportModal: React.FC<BulkQuestionImportModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
  existingCount,
  currentLanguage = 'ta',
  defaultMarks = 2,
}) => {
  const [activeMode, setActiveMode] = useState<'excel' | 'text'>('excel');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<QuestionItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Download Sample Excel Template
  const handleDownloadSample = (format: 'xlsx' | 'csv') => {
    const sampleData = [
      {
        'Question Text (வினா)': 'What is the capital of Sri Lanka?',
        'Option A (தெரிவு A)': 'Colombo',
        'Option B (தெரிவு B)': 'Sri Jayawardenepura Kotte',
        'Option C (தெரிவு C)': 'Kandy',
        'Option D (தெரிவு D)': 'Galle',
        'Correct Answer (சரியான விடை)': 'B',
        'Marks (மதிப்பெண்)': 2,
      },
      {
        'Question Text (வினா)': 'இலங்கையின் தேசிய மலர் எது?',
        'Option A (தெரிவு A)': 'தாமரை',
        'Option B (தெரிவு B)': 'நீலோற்பலம்',
        'Option C (தெரிவு C)': 'ரோஜா',
        'Option D (தெரிவு D)': 'மல்லிகை',
        'Correct Answer (சரியான விடை)': 'B',
        'Marks (மதிப்பெண்)': 2,
      },
      {
        'Question Text (வினா)': 'Which planet is known as the Red Planet?',
        'Option A (தெரிவு A)': 'Venus',
        'Option B (தெரிவு B)': 'Mars',
        'Option C (தெரிவு C)': 'Jupiter',
        'Option D (தெரிவு D)': 'Saturn',
        'Correct Answer (சரியான விடை)': 'B',
        'Marks (மதிப்பெண்)': 2,
      },
      {
        'Question Text (வினா)': 'மனித உடலின் மிகப்பெரிய உள்ளுறுப்பு எது?',
        'Option A (தெரிவு A)': 'இதயம்',
        'Option B (தெரிவு B)': 'நுரையீரல்',
        'Option C (தெரிவு C)': 'ஈரல் (Liver)',
        'Option D (தெரிவு D)': 'சிறுநீரகம்',
        'Correct Answer (சரியான விடை)': 'C',
        'Marks (மதிப்பெண்)': 5,
      },
      {
        'Question Text (வினா)': 'The chemical symbol for water is H2O.',
        'Option A (தெரிவு A)': 'True',
        'Option B (தெரிவு B)': 'False',
        'Option C (தெரிவு C)': '',
        'Option D (தெரிவு D)': '',
        'Correct Answer (சரியான விடை)': 'True',
        'Marks (மதிப்பெண்)': 1,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    // Set column widths
    ws['!cols'] = [
      { wch: 45 }, // Question
      { wch: 25 }, // Opt A
      { wch: 25 }, // Opt B
      { wch: 25 }, // Opt C
      { wch: 25 }, // Opt D
      { wch: 20 }, // Answer
      { wch: 12 }, // Marks
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions_Template');

    if (format === 'xlsx') {
      XLSX.writeFile(wb, 'Exam_Questions_Template.xlsx');
    } else {
      XLSX.writeFile(wb, 'Exam_Questions_Template.csv');
    }
  };

  // Helper to normalize keys from Excel rows preserving unicode Tamil/Sinhala letters
  const normalizeKey = (key: string): string => {
    return key.toLowerCase().trim().replace(/[\s_\-\(\)\[\]:.,\/\\]+/g, '');
  };

  // Parse Text Lines directly into Questions
  const parseRawTextString = (text: string, baseOrder: number): QuestionItem[] => {
    const lines = text.split('\n');
    const items: QuestionItem[] = [];

    let currentQText = '';
    let currentOptions: string[] = [];
    let currentCorrect = '';
    let currentMarks = defaultMarks;

    const commitCurrentQuestion = () => {
      if (currentQText.trim()) {
        let finalCorrect = currentOptions[0] || '';
        const normCorrect = currentCorrect.trim().toUpperCase();

        if (normCorrect === 'A' || normCorrect === '1') {
          finalCorrect = currentOptions[0] || finalCorrect;
        } else if (normCorrect === 'B' || normCorrect === '2') {
          finalCorrect = currentOptions[1] || finalCorrect;
        } else if (normCorrect === 'C' || normCorrect === '3') {
          finalCorrect = currentOptions[2] || finalCorrect;
        } else if (normCorrect === 'D' || normCorrect === '4') {
          finalCorrect = currentOptions[3] || finalCorrect;
        } else if (currentOptions.some((o) => o.toLowerCase() === currentCorrect.toLowerCase())) {
          const match = currentOptions.find((o) => o.toLowerCase() === currentCorrect.toLowerCase());
          if (match) finalCorrect = match;
        } else if (currentCorrect) {
          finalCorrect = currentCorrect;
        }

        items.push({
          id: `q-bulk-${Date.now()}-${items.length + 1}`,
          type: currentOptions.length > 0 ? 'multiple_choice' : 'short_answer',
          questionText: currentQText.trim(),
          options: currentOptions.length > 0 ? [...currentOptions] : [],
          correctAnswer: finalCorrect,
          marks: currentMarks,
          order: baseOrder + items.length + 1,
          imageUrl: '',
          explanation: '',
        });
      }

      currentQText = '';
      currentOptions = [];
      currentCorrect = '';
      currentMarks = defaultMarks;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check if line is Answer / விடை / பதில் / Ans
      const ansMatch = line.match(/^(?:Answer|Ans|Correct|விடை|சரியான விடை|பதில்|පිළිතුර)[\s:=]+(.+)$/i);
      if (ansMatch) {
        currentCorrect = ansMatch[1].trim();
        continue;
      }

      // Check if line is Marks / புள்ளிகள்
      const markMatch = line.match(/^(?:Marks|Mark|புள்ளிகள்|மதிப்பெண்|புள்ளி|Points|Pts|Score|ලකුණු)[\s:=]+(\d+(?:\.\d+)?)/i);
      if (markMatch) {
        currentMarks = parseFloat(markMatch[1]) || defaultMarks;
        continue;
      }

      // Check if line is an Option: A), B., (C), 1), 2., etc.
      const optMatch = line.match(/^(?:[A-Da-d1-4][\.\)]|\([A-Da-d1-4]\))\s*(.+)$/);
      if (optMatch) {
        currentOptions.push(optMatch[1].trim());
        continue;
      }

      // Check if line starts with question number: e.g. "1.", "1)", "Q1:", "வினா 1:"
      const qNumMatch = line.match(/^(?:Q\d+[\.:]?|\d+[\.:\)]|வினா\s*\d+[\.:]?|கேள்வி\s*\d+[\.:]?)\s*(.+)$/i);
      if (qNumMatch) {
        if (currentQText) {
          commitCurrentQuestion();
        }
        currentQText = qNumMatch[1].trim();
        continue;
      }

      // If we don't have options yet, treat as continuation of question text or new question
      if (currentOptions.length === 0) {
        if (currentQText) {
          currentQText += ' ' + line;
        } else {
          currentQText = line;
        }
      } else {
        // If we already have options and see a fresh line that looks like a new question
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

          const items: QuestionItem[] = rawArray.map((row, idx) => ({
            id: `q-json-${Date.now()}-${idx + 1}`,
            type: (row.type as any) || (Array.isArray(row.options) && row.options.length > 0 ? 'multiple_choice' : 'short_answer'),
            questionText: String(row.questionText || row.question || row.text || row.வினா || '').trim(),
            options: Array.isArray(row.options) ? row.options.map((o: any) => String(o).trim()) : [],
            correctAnswer: String(row.correctAnswer || row.answer || row.விடை || '').trim(),
            marks: typeof row.marks === 'number' ? row.marks : defaultMarks,
            order: baseOrder + idx + 1,
            imageUrl: row.imageUrl || '',
            explanation: row.explanation || '',
          }));

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
          let optA = '';
          let optB = '';
          let optC = '';
          let optD = '';
          let correct = '';
          let marks = defaultMarks;

          for (const rawKey of Object.keys(row)) {
            const val = String(row[rawKey] || '').trim();
            const norm = normalizeKey(rawKey);

            if (
              norm.includes('question') ||
              norm.includes('text') ||
              norm.includes('qtext') ||
              norm.includes('vina') ||
              norm.includes('kelvi') ||
              norm.includes('வினா') ||
              norm.includes('கேள்வி') ||
              norm === 'q'
            ) {
              qText = val;
            } else if (
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
              norm.includes('correct') ||
              norm.includes('answer') ||
              norm.includes('ans') ||
              norm.includes('விடை') ||
              norm.includes('பதில்') ||
              norm.includes('சரியானவிடை') ||
              norm.includes('vidai') ||
              norm === 'key'
            ) {
              correct = val;
            } else if (
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
            }
          }

          // Fallback if positional
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
            const options: string[] = [];
            if (optA) options.push(optA);
            if (optB) options.push(optB);
            if (optC) options.push(optC);
            if (optD) options.push(optD);

            // Determine correct answer text
            let finalCorrect = optA;
            const normCorrect = correct.toUpperCase().trim();

            if (normCorrect === 'A' || normCorrect === '1' || normCorrect === 'OPTION A') {
              finalCorrect = optA;
            } else if (normCorrect === 'B' || normCorrect === '2' || normCorrect === 'OPTION B') {
              finalCorrect = optB || optA;
            } else if (normCorrect === 'C' || normCorrect === '3' || normCorrect === 'OPTION C') {
              finalCorrect = optC || optA;
            } else if (normCorrect === 'D' || normCorrect === '4' || normCorrect === 'OPTION D') {
              finalCorrect = optD || optA;
            } else if (options.includes(correct)) {
              finalCorrect = correct;
            } else if (options.length > 0) {
              finalCorrect = options[0];
            }

            items.push({
              id: `q-bulk-${Date.now()}-${idx + 1}`,
              type: options.length > 0 ? 'multiple_choice' : 'short_answer',
              questionText: qText,
              options: options.length > 0 ? options : [],
              correctAnswer: finalCorrect,
              marks: marks,
              order: baseOrder + idx + 1,
              imageUrl: '',
              explanation: '',
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

  // Insert Sample Text
  const handleInsertSampleText = () => {
    const sample = `1. Which gas is most abundant in the Earth's atmosphere?
A) Oxygen
B) Nitrogen
C) Carbon Dioxide
D) Hydrogen
Answer: B
Marks: 2

2. இலங்கையின் தற்போதைய தலைநகரம் எது?
A) கொழும்பு
B) ஸ்ரீ ஜெயவர்த்தனபுர கோட்டே
C) கண்டி
D) காலி
விடை: B
Marks: 2

3. What is the powerhouse of the biological cell?
A) Nucleus
B) Mitochondria
C) Ribosome
D) Cell Wall
Answer: B
Marks: 3

4. கணிதத்தில் 'பை' (Pi) இன் தோராய மதிப்பு என்ன?
A) 2.14
B) 3.14
C) 4.14
D) 1.41
விடை: B
Marks: 2`;

    setRawText(sample);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      preventBackdropClose={true}
      maxWidthClass="max-w-3xl"
      title={
        currentLanguage === 'ta'
          ? 'வினாத்தாளைப் பதிவேற்றுதல் (Upload Question Paper / Quiz)'
          : 'Bulk Upload Question Paper (Excel / CSV / Text / JSON)'
      }
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 text-slate-800">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveMode('excel');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
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
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
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
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition ${
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
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition ${
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
          <div className="space-y-4">
            {/* Guide & Sample Template Download Bar */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 text-xs">
                <p className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {currentLanguage === 'ta'
                      ? 'Excel, CSV, Text அல்லது JSON வினாத்தாளை எளிதாகப் பதிவேற்றுங்கள்'
                      : 'Upload dozens of questions with Options A, B, C, D in 1 click'}
                  </span>
                </p>
                <p className="text-[11px] text-blue-800">
                  {currentLanguage === 'ta'
                    ? 'ஆதரிக்கப்படும் தலைப்புகள்: Question, Option A, Option B, Option C, Option D, Correct Answer, Marks (அல்லது தமிழில் வினா, தெரிவு A, தெரிவு B, சரியான விடை, மதிப்பெண்).'
                    : 'Columns: Question Text, Option A, Option B, Option C, Option D, Correct Answer, Marks.'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadSample('xlsx')}
                  className="px-2.5 py-1.5 bg-white border border-blue-300 text-blue-900 rounded-lg text-xs font-bold hover:bg-blue-100/60 transition flex items-center gap-1 shadow-2xs"
                  title="Download .xlsx sample"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>.xlsx மாதிரி</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSample('csv')}
                  className="px-2.5 py-1.5 bg-white border border-blue-300 text-blue-900 rounded-lg text-xs font-bold hover:bg-blue-100/60 transition flex items-center gap-1 shadow-2xs"
                  title="Download .csv sample"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>.csv மாதிரி</span>
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/30 transition cursor-pointer">
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
                  : 'Click or drop your .xlsx, .csv, .txt or .json file here'}
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
                  ? 'வினாக்களை கீழே ஒட்டவும் (Word, PDF, WhatsApp குறிப்புகள்):'
                  : 'Paste questions text below:'}
              </span>
              <button
                type="button"
                onClick={handleInsertSampleText}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>
                  {currentLanguage === 'ta' ? 'மாதிரி உரையை நிரப்புக (Sample)' : 'Fill Sample Text'}
                </span>
              </button>
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`1. இலங்கையின் தேசிய மலர் எது?
A) தாமரை
B) நீலோற்பலம்
C) ரோஜா
D) மல்லிகை
விடை: B
Marks: 2

2. What is the capital of Sri Lanka?
A) Colombo
B) Sri Jayawardenepura Kotte
C) Kandy
D) Galle
Answer: B
Marks: 2`}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParseText}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>{currentLanguage === 'ta' ? 'வினாக்களைப் பிரித்தெடு (Parse Questions)' : 'Parse Questions'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PARSED PREVIEW SECTION */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-900">
                  {currentLanguage === 'ta'
                    ? `${parsedQuestions.length} வினாக்கள் வெற்றிகரமாகக் கண்டறியப்பட்டன:`
                    : `${parsedQuestions.length} questions successfully parsed:`}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Total Marks:{' '}
                {parsedQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)} pts
              </span>
            </div>

            {/* Scrollable Questions list */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {parsedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{q.questionText}</p>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Type: {q.type} • {q.marks} Marks
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setParsedQuestions(parsedQuestions.filter((_, i) => i !== idx))
                      }
                      className="text-slate-400 hover:text-red-600 transition p-1"
                      title="Remove this question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-7">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctAnswer === opt;
                        return (
                          <div
                            key={optIdx}
                            className={`px-2 py-1 rounded text-[11px] flex items-center gap-1.5 border transition ${
                              isCorrect
                                ? 'bg-emerald-100/70 border-emerald-300 font-bold text-emerald-950'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-mono text-[10px] text-slate-500">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="truncate">{opt}</span>
                            {isCorrect && (
                              <span className="ml-auto text-[9px] bg-emerald-600 text-white px-1 py-0.2 rounded font-semibold">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            {currentLanguage === 'ta' ? 'ரத்து செய்க' : 'Cancel'}
          </button>

          <button
            type="button"
            id="btn-confirm-bulk-import"
            onClick={handleConfirmImport}
            disabled={parsedQuestions.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            <span>
              {currentLanguage === 'ta'
                ? `${parsedQuestions.length} வினாக்களை வினாத்தாளில் சேர்க்க`
                : `Import ${parsedQuestions.length} Questions to Quiz`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

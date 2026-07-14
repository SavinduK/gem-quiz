import { FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeleteModal from './components/delete-model';
import Footer from './components/footer';
import Header from './components/header';
import ModuleSelector from './components/module-selector';
import QuizCard from './components/quiz-card';
import QuizResults from './components/quiz-results';
import { Colors } from './constants/theme';

interface TargetFile {
  filename: string;
  subject: string;
  term: string;
  lesson: string;
}

interface MCQQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  statements?: string[];
  answers?: boolean[];
}

const FALLBACK_GEMINI_API_KEY = ""; 

const QUESTIONS_DIR = `${FileSystem.documentDirectory}questions/`;
const CACHE_DIR = `${FileSystem.documentDirectory}cached-questions/`;
const KEY_FILE_URI = `${FileSystem.documentDirectory}key.txt`;

export default function QuestionSession() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [filesMeta, setFilesMeta] = useState<TargetFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDeck, setActiveDeck] = useState<MCQQuestion[] | null>(null);
  const [isTFQuiz, setIsTFQuiz] = useState<boolean>(false);
  
  // Reading View State
  const [readingFile, setReadingFile] = useState<TargetFile | null>(null);
  const [readingContent, setReadingContent] = useState<string>("");

  // Single Question Display & Quiz State Indexes
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [runningScore, setRunningScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  
  // Selection trackers
  const [chosenAnswer, setChosenAnswer] = useState<string | null>(null);
  const [tfSelections, setTfSelections] = useState<{ [key: number]: boolean | null }>({0: null, 1: null, 2: null, 3: null, 4: null});
  const [tfChecked, setTfChecked] = useState<boolean>(false);
  const [tfQuestionScore, setTfQuestionScore] = useState<number>(0); 

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [targetFilename, setTargetFilename] = useState<string | null>(null);

  const indexLocalFiles = async () => {
    try {
      const check = await FileSystem.getInfoAsync(QUESTIONS_DIR);
      if (!check.exists) return;
      const items = await FileSystem.readDirectoryAsync(QUESTIONS_DIR);
      const builds: TargetFile[] = [];
      for (const item of items) {
        if (item.endsWith('.txt')) {
          const cleanName = item.replace('.txt', '');
          const parts = cleanName.split('-');
          if (parts.length >= 3) {
            builds.push({
              filename: item,
              lesson: parts[0].replace(/_/g, ' '),
              subject: parts[1].replace(/_/g, ' '),
              term: parts[2].replace(/_/g, ' ')
            });
          }
        }
      }
      setFilesMeta(builds);
    } catch (e) { console.error(e); }
  };

  useFocusEffect(useCallback(() => { indexLocalFiles(); }, []));

  const handleDeleteFile = async () => {
    if (!targetFilename) return;
    try {
      const fileUri = `${QUESTIONS_DIR}${targetFilename}`;
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      const jsonFilename = targetFilename.replace('.txt', '.json');
      const cacheUri = `${CACHE_DIR}${jsonFilename}`;
      const cacheCheck = await FileSystem.getInfoAsync(cacheUri);
      if (cacheCheck.exists) await FileSystem.deleteAsync(cacheUri, { idempotent: true });
      setDeleteModalVisible(false);
      setTargetFilename(null);
      if (readingFile?.filename === targetFilename) {
        setReadingFile(null);
        setReadingContent("");
      }
      indexLocalFiles();
    } catch (e) { console.error(e); }
  };

  // Callback to load file and activate Reading View
  const openLessonReader = async (file: TargetFile) => {
    setLoading(true);
    try {
      const content = await FileSystem.readAsStringAsync(`${QUESTIONS_DIR}${file.filename}`);
      setReadingFile(file);
      setReadingContent(content);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not load lesson contents.");
    } finally {
      setLoading(false);
    }
  };

  const launchDeck = async (filename: string) => {
    setLoading(true);
    setCurrentQuestionIdx(0);
    setRunningScore(0);
    setQuizFinished(false);
    setChosenAnswer(null);
    setTfSelections({0: null, 1: null, 2: null, 3: null, 4: null});
    setTfChecked(false);
    setTfQuestionScore(0);

    const jsonCacheFilename = filename.replace('.txt', '.json');
    const specificCacheUri = `${CACHE_DIR}${jsonCacheFilename}`;

    try {
      let activeApiKey = FALLBACK_GEMINI_API_KEY;
      let targetCount = 5;
      let targetStyle = 'MCQ';
      let customPrompt = "";

      try {
        const keyFileCheck = await FileSystem.getInfoAsync(KEY_FILE_URI);
        if (keyFileCheck.exists) {
          const lines = (await FileSystem.readAsStringAsync(KEY_FILE_URI)).split('\n');
          if (lines[0]) activeApiKey = lines[0].trim();
          if (lines[1]) targetCount = parseInt(lines[1].trim(), 10) || 5;
          if (lines[2]) targetStyle = lines[2].trim() === 'TF' ? 'TF' : 'MCQ';
          if (lines[3]) customPrompt = lines[3].trim();
        }
      } catch (keyError) {
        console.warn("Relying on default configurations.", keyError);
      }

      setIsTFQuiz(targetStyle === 'TF');
      const targetStr = await FileSystem.readAsStringAsync(`${QUESTIONS_DIR}${filename}`);
      
      let prompt = "";
      if (targetStyle === 'MCQ') {
        prompt = `Based on the following source material text, generate exactly ${targetCount} multiple choice questions. Each question must have exactly 5 distinct options. Return the data strictly as a JSON object containing an array called "questions". Each item in the array must contain "question" (string), "options" (array of 5 strings), and "correct_answer" (string matching exactly one of the options).${customPrompt} \nSource material text:${targetStr}`;
      } else {
        prompt = `Based on the following source material text, generate exactly ${targetCount} True/False style questions. Each item must contain a header topic text called "question", and an array of exactly 5 distinct conceptual statements related to it. For each statement, provide its corresponding boolean true/false answer value. Return data strictly as a JSON object containing an array called "questions". Structure: {"questions": [{"question": "string context", "statements": ["s1", "s2", "s3", "s4", "s5"], "answers": [true, false, true, true, false]}]}.${customPrompt} \nSource material text:${targetStr}`;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const resData = await response.json();
      const rawJsonText = resData.candidates[0].content.parts[0].text;
      
      const cacheDirCheck = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!cacheDirCheck.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
      await FileSystem.writeAsStringAsync(specificCacheUri, rawJsonText);

      const parsedQuiz = JSON.parse(rawJsonText);
      let targetDeck: MCQQuestion[] = parsedQuiz.questions || parsedQuiz;
      
      setReadingFile(null); 
      setActiveDeck(targetDeck);

    } catch (e) { 
      console.warn("Online generation failed or device offline. Checking workspace cache alternatives...", e);
      
      try {
        const localCacheCheck = await FileSystem.getInfoAsync(specificCacheUri);
        if (localCacheCheck.exists) {
          const rawCachedText = await FileSystem.readAsStringAsync(specificCacheUri);
          const parsedCache = JSON.parse(rawCachedText);
          let targetDeck: MCQQuestion[] = parsedCache.questions || parsedCache;
          
          setReadingFile(null);
          setActiveDeck(targetDeck);
          Alert.alert("Offline Mode Active", "Loaded previously compiled questions from cache filesystem successfully.");
        } else {
          Alert.alert("Network Unavailable", "Could not query online servers, and no cached alternative exists for this module.");
        }
      } catch (cacheReadError) {
        console.error("Critical extraction failure handling cache data strings", cacheReadError);
        Alert.alert("Generation Failed", "Could not verify storage fallbacks.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (!activeDeck) return;
    if (currentQuestionIdx + 1 < activeDeck.length) {
      setCurrentQuestionIdx(p => p + 1);
      setChosenAnswer(null);
      setTfSelections({0: null, 1: null, 2: null, 3: null, 4: null});
      setTfChecked(false);
      setTfQuestionScore(0);
    } else {
      setQuizFinished(true);
    }
  };

  const evaluateTfQuestion = () => {
    if (!activeDeck) return;
    const currentQ = activeDeck[currentQuestionIdx];
    let calculatedQScore = 0;

    for (let i = 0; i < 5; i++) {
      const selected = tfSelections[i];
      const realAnswer = currentQ.answers?.[i];

      if (selected !== null && selected !== undefined) {
        if (selected === realAnswer) {
          calculatedQScore += 1; 
        } else {
          calculatedQScore -= 1; 
        }
      }
    }

    const finalClampedQScore = Math.max(0, calculatedQScore);
    
    setTfQuestionScore(finalClampedQScore);
    setRunningScore(p => p + finalClampedQScore);
    setTfChecked(true);
  };

  const maxPossibleScore = activeDeck ? (isTFQuiz ? activeDeck.length * 5 : activeDeck.length) : 0;

  const copyToClipboard = async (filename: string) => {
    const targetStr = await FileSystem.readAsStringAsync(`${QUESTIONS_DIR}${filename}`);
    await Clipboard.setStringAsync(targetStr);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Lecture Questions" onRightButtonPress={() => router.push('/add-questions')} />

      {/* 1. Global Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.subtext, marginTop: 12, fontWeight: '500' }}>Compiling Questions...</Text>
        </View>
      )}

      {/* 2. Reading View Container */}
      {!loading && readingFile && !activeDeck && (
        <View style={{ flex: 1 }}>
          <View style={[styles.readerHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => { setReadingFile(null); setReadingContent(""); }}
            >
              <FontAwesome5 name="arrow-left" size={16} color={theme.text}/>
              <Text style={[styles.lessonTitleLarge, { color: theme.text,marginHorizontal:10, }]} numberOfLines={1} ellipsizeMode='tail'>{readingFile.lesson}</Text>
            </TouchableOpacity>

            <View style={styles.readerActions}>
              <TouchableOpacity 
                style={[styles.actionChip, { backgroundColor: theme.buttons }]} 
                onPress={() => launchDeck(readingFile.filename)}
              >
                <FontAwesome5 name="bolt" size={12} color={theme.accent} />
                <Text style={[styles.actionChipText, { color: theme.accent }]}> Quiz</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionChip, { backgroundColor: theme.accent + '15' }]} 
                onPress={() => copyToClipboard(readingFile.filename)}
              >
                <FontAwesome5 name="copy" size={12} color={theme.accent} />
                <Text style={[styles.actionChipText, { color: theme.accent }]}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            <Text style={[styles.noteContent, { color: theme.text }]}>{readingContent}</Text>
          </ScrollView>
        </View>
      )}

      {/* 3. Selection View */}
      {!loading && !readingFile && !activeDeck && (
        <ModuleSelector
          availableLessons={filesMeta}
          launchDeck={launchDeck}
          copyToClipboard={copyToClipboard}
          onSelectDeleteTarget={(filename) => { setTargetFilename(filename); setDeleteModalVisible(true); }}
          onSelectLesson={openLessonReader}
        />
      )}

      {/* 4. Quiz Game View */}
      {!loading && activeDeck && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View>
            {quizFinished ? (
              <QuizResults  
                runningScore={runningScore} 
                maxPossibleScore={maxPossibleScore} 
                onReturn={() => setActiveDeck(null)} 
              />
            ) : (
              <QuizCard
                item={activeDeck[currentQuestionIdx]}
                chosenAnswer={chosenAnswer}
                runningScore={runningScore}
                maxPossibleScore={maxPossibleScore}
                setChosenAnswer={setChosenAnswer}
                setRunningScore={setRunningScore}
                tfSelections={tfSelections}
                setTfSelections={setTfSelections}
                tfChecked={tfChecked}
                tfQuestionScore={tfQuestionScore}
                evaluateTfQuestion={evaluateTfQuestion}
                handleNextQuestion={handleNextQuestion}
                currentQuestionIdx={currentQuestionIdx}
                totalQuestions={activeDeck.length}
              />
            )}
          </View>
        </ScrollView>
      )}

      <DeleteModal visible={deleteModalVisible} onCancel={() => setDeleteModalVisible(false)} onConfirm={handleDeleteFile} />
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 25 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Reader View Styles
  readerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, marginBottom: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 15, fontWeight: '600' },
  readerActions: { flexDirection: 'row', gap: 8 },
  actionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  actionChipText: { fontSize: 13, fontWeight: '700' },
  metaLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  lessonTitleLarge: { fontSize: 20, fontWeight: '700', lineHeight: 30, textTransform: 'uppercase' },
  divider: { height: 1, marginVertical: 16 },
  noteContent: { fontSize: 15, lineHeight: 24, paddingBottom: 40 },
});
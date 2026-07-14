import { FontAwesome5 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Footer from './components/footer';
import Header from './components/header';
import { Colors } from './constants/theme';

const KEY_FILE_URI = `${FileSystem.documentDirectory}key.txt`;

export default function Settings() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [qCount, setQCount] = useState<number>(5);
  const [qStyle, setQStyle] = useState<'MCQ' | 'TF'>('MCQ');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // States to manage section collapsibility
  const [aiExpanded, setAiExpanded] = useState(false);
  const [quizExpanded, setQuizExpanded] = useState(true);

  // Load configuration parsing lines from key.txt
  const loadSettings = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(KEY_FILE_URI);
      if (fileInfo.exists) {
        const lines = (await FileSystem.readAsStringAsync(KEY_FILE_URI)).split('\n');
        if (lines[0]) setApiKey(lines[0].trim());
        if (lines[1]) setQCount(parseInt(lines[1].trim(), 10) || 5);
        if (lines[2]) setQStyle(lines[2].trim() === 'TF' ? 'TF' : 'MCQ');
        if (lines[3]) setCustomPrompt(lines[3].trim());
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const cleanKey = apiKey.trim();
      const cleanPrompt = customPrompt.trim();
      const configPayload = `${cleanKey}\n${qCount}\n${qStyle}\n${cleanPrompt}`;
      await FileSystem.writeAsStringAsync(KEY_FILE_URI, configPayload);
      
      Alert.alert("Success", "Configuration preferences updated successfully.");
    } catch (e) {
      console.error("Failed to save preferences:", e);
      Alert.alert("Error", "Could not save configurations locally.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
     <Header title='Configuraton Settings'/>

      <View style={styles.content}>
        
        {/* SECTION 1: AI ENGINE CREDENTIALS */}
        <Pressable 
          style={styles.accordionHeader} 
          onPress={() => setAiExpanded(!aiExpanded)}
        >
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>AI settings</Text>
          <FontAwesome5 
            name={aiExpanded ? "chevron-up" : "chevron-down"} 
            size={12} 
            color={theme.accent} 
          />
        </Pressable>

        {aiExpanded && (
          <View style={styles.configCard}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, { color: theme.title }]}>Gemini API Key</Text>
            </View>

            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <TextInput
                style={[styles.flexInput, { color: theme.title }]}
                placeholder="Paste your Gemini API key here"
                placeholderTextColor={theme.subtext}
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showApiKey} 
              />
              <Pressable 
                onPress={() => setShowApiKey(!showApiKey)} 
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <FontAwesome5 name={showApiKey ? "eye" : "eye-slash"} size={15} color={theme.subtext} />
              </Pressable>
            </View>
          </View>
        )}

        {/* SECTION SEPARATOR HORIZONTAL BAR */}
        <View style={[styles.horizontalBar, { backgroundColor: theme.border }]} />

        {/* SECTION 2: QUIZ GENERATION SETTINGS */}
        <Pressable 
          style={styles.accordionHeader} 
          onPress={() => setQuizExpanded(!quizExpanded)}
        >
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>Quiz Settings</Text>
          <FontAwesome5 
            name={quizExpanded ? "chevron-up" : "chevron-down"} 
            size={12} 
            color={theme.accent} 
          />
        </Pressable>

        {quizExpanded && (
          <View style={styles.configCard}>
            
            {/* QUESTION COUNT SELECTOR */}
            <View style={styles.settingRow}>
              <Text style={[styles.inputLabel, { color: theme.title, marginBottom: 8 }]}>Number of Questions</Text>
              <View style={[styles.segmentedControl, { borderColor: theme.border }]}>
                {[5, 10, 15, 20].map((num, idx) => (
                  <React.Fragment key={num}>
                    {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                    <Pressable
                      style={[styles.segmentBtn, qCount === num && { backgroundColor: theme.buttons }]}
                      onPress={() => setQCount(num)}
                    >
                      <Text style={[styles.segmentText, { color: qCount === num ? '#fff' : theme.title }]}>{num}</Text>
                    </Pressable>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* QUESTION STYLE SELECTOR */}
            <View style={styles.settingRow}>
              <Text style={[styles.inputLabel, { color: theme.title, marginBottom: 8 }]}>Question Type</Text>
              <View style={[styles.segmentedControl, { borderColor: theme.border }]}>
                <Pressable
                  style={[styles.segmentBtn, { flex: 1 }, qStyle === 'MCQ' && { backgroundColor: theme.buttons}]}
                  onPress={() => setQStyle('MCQ')}
                >
                  <Text style={[styles.segmentText, { color: qStyle === 'MCQ' ? '#fff' : theme.title }]}>MCQ</Text>
                </Pressable>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Pressable
                  style={[styles.segmentBtn, { flex: 1 }, qStyle === 'TF' && { backgroundColor: theme.buttons }]}
                  onPress={() => setQStyle('TF')}
                >
                  <Text style={[styles.segmentText, { color: qStyle === 'TF' ? '#fff' : theme.title }]}>T/F Style</Text>
                </Pressable>
              </View>
            </View>

            {/* CUSTOM SYSTEM PROMPT */}
            <View style={styles.settingRow}>
              <View style={[styles.labelRow, { marginBottom: 8 }]}>
                <Text style={[styles.inputLabel, { color: theme.title }]}>Custom Generation Instructions</Text>
              </View>
              <TextInput
                style={[styles.textArea, { color: theme.title, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="e.g., Focus heavily on clinical diagnostics..."
                placeholderTextColor={theme.subtext}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <Pressable 
              style={[styles.saveBtn, { backgroundColor: theme.buttons, opacity: isSaving ? 0.7 : 1 }]} 
              onPress={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <FontAwesome5 name="save" size={14} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Save Configurations</Text>
                </>
              )}
            </Pressable>
          </View>
        
      )}
      </View>
      <Footer/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingTop: 25, paddingBottom: 25 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  content: { flex: 1, paddingHorizontal: 25,paddingVertical:20 },
  accordionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10,
    paddingRight: 5
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 5 },
  horizontalBar: { height: 1, width: '100%', marginVertical: 14, opacity: 0.6 },
  configCard: { paddingVertical: 10, paddingHorizontal: 5, gap: 16 },
  settingRow: { gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  inputLabel: { fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 48, 
    borderRadius: 14, 
    borderWidth: 1, 
    paddingLeft: 16, 
    overflow: 'hidden',
    marginTop: 8
  },
  flexInput: { flex: 1, height: '100%', fontSize: 14 },
  eyeBtn: { height: '100%', paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  textArea: { minHeight: 80, borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 14, lineHeight: 20 },
  segmentedControl: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(0,0,0,0.02)', 
    borderRadius: 14, 
    borderWidth: 1, 
    padding: 4 
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentText: { fontSize: 13, fontWeight: '600' },
  divider: { width: 1, height: '50%', alignSelf: 'center' },
  saveBtn: { height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 }
});
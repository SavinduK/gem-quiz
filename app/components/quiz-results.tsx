import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../constants/theme';

interface QuizResultsProps {
  runningScore: number;
  maxPossibleScore: number;
  onReturn: () => void;
}

export default function QuizResults({  runningScore, maxPossibleScore, onReturn }: QuizResultsProps) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const accuracy = maxPossibleScore > 0 ? Math.round((runningScore / maxPossibleScore) * 100) : 0;
  
  return (
    <View style={[styles.resultsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: 'rgba(74, 222, 128, 0.15)' }]}>
        <FontAwesome5 name="trophy" size={36} color="#4ade80" />
      </View>
      <Text style={[styles.resultsTitle, { color: theme.title }]}>Quiz Complete!</Text>
      <Text style={[styles.resultsSubtitle, { color: theme.subtext }]}>You have successfully reviewed this section.</Text>
      
      <View style={[styles.finalScoreBox, { backgroundColor: theme.background }]}>
        <Text style={[styles.finalScoreLabel, { color: theme.subtext }]}>TOTAL MARKS EARNED</Text>
        <Text style={[styles.finalScoreText, { color: theme.accent }]}>{runningScore} / {maxPossibleScore}</Text>
        <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
          Accuracy Rate: {accuracy}%
        </Text>
      </View>

      <Pressable style={[styles.submitActionBtn, { backgroundColor: theme.accent, width: '100%' }]} onPress={onReturn}>
        <FontAwesome5 name="home" size={14} color="white" style={{ marginRight: 8 }} />
        <Text style={styles.submitActionBtnText}>Return to Modules</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
    resultsCard: { padding: 30, borderRadius: 28, borderWidth: 1, alignItems: 'center', marginTop: 10 },
    iconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    resultsTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
    resultsSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10, marginBottom: 24 },
    finalScoreBox: { width: '100%', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 24 },
    finalScoreLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
    finalScoreText: { fontSize: 32, fontWeight: '900' },
    submitActionBtn: { height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
    submitActionBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
});
import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../constants/theme';

interface Lesson {
  filename: string;
  lesson: string;
  subject: string;
  term: string;
}

interface ModuleSelectorProps {
  selectedSubject: string | null;
  selectedTerm: string | null;
  availableLessons: Lesson[];
  setSubModalVisible: (visible: boolean) => void;
  setTermModalVisible: (visible: boolean) => void;
  launchDeck: (filename: string) => void;
  copyToClipboard: (filename: string) => void;
  onSelectDeleteTarget: (filename: string) => void;
}

export default function ModuleSelector({selectedSubject,selectedTerm,availableLessons,setSubModalVisible,setTermModalVisible,
  launchDeck,copyToClipboard,onSelectDeleteTarget,}: ModuleSelectorProps) {
    
  const theme = Colors[useColorScheme() ?? 'light'];
  return (
    <View style={styles.container}>
      <View style={styles.dropdownRow}>
        <Pressable style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setSubModalVisible(true)}>
          <Text style={[styles.dropdownText, { color: theme.title }]} numberOfLines={1}>{selectedSubject ?? "Select Subject"}</Text>
          <FontAwesome5 name="chevron-down" size={12} color={theme.subtext} />
        </Pressable>
        <Pressable onPress={() => { if(selectedSubject) setTermModalVisible(true); }} style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border, opacity: selectedSubject ? 1 : 0.5 }]}>
          <Text style={[styles.dropdownText, { color: theme.title }]} numberOfLines={1}>{selectedTerm ?? "Select Term"}</Text>
          <FontAwesome5 name="chevron-down" size={12} color={theme.subtext} />
        </Pressable>
      </View>
      <View style={{ marginTop: 5 }}>
        {selectedSubject && selectedTerm ? (
          <View style={{alignItems:'center',justifyContent:'center'}}>
            <Text style={[styles.label, { color: theme.accent }]}>Available Modules</Text>
            {availableLessons.length === 0 ? (
              <Text style={{ color: theme.subtext, fontStyle: 'italic', marginLeft: 5 }}>No lessons found.</Text>
            ) : (
              availableLessons.map(les => (
                <View key={les.filename} style={[styles.lessonRowContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Pressable style={styles.lessonPressable} onPress={() => launchDeck(les.filename)}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lessonTitle, { color: theme.title }]}>{les.lesson}</Text>
                      <Text style={{ color: theme.subtext, fontSize: 12 }}>{les.subject} • {les.term}</Text>
                    </View>
                    <FontAwesome5 name="copy" size={16} color={theme.title} onPress={()=>{copyToClipboard(les.filename)}} />
                  </Pressable>
                  <Pressable style={styles.deleteBtn} onPress={() => onSelectDeleteTarget(les.filename)}>
                    <FontAwesome5 name="trash" size={14} color={theme.delete} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <FontAwesome5 name="hand-pointer" size={35} color={theme.border} style={{ marginBottom: 12 }} />
            <Text style={{ color: theme.subtext, textAlign: 'center', fontWeight: '500' }}>Choose a subject and term above to display modules.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    dropdownRow: { flexDirection: 'row', paddingHorizontal: 25, marginBottom: 20,marginTop:16, gap: 12 },
    dropdown: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
    dropdownText: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
    label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
    placeholderContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    lessonRowContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, marginBottom: 10, paddingRight: 10 },
    lessonPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 18 },
    lessonTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    deleteBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)' },
});
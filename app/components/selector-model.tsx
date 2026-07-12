import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../constants/theme';

interface SelectorModalProps {
  visible: boolean;
  title: string;
  items: string[];
  onClose: () => void;
  onSelect: (item: string) => void;
}

export default function SelectorModal({
  visible,
  title,
  items,
  onClose,
  onSelect,
}: SelectorModalProps) {
  const theme = Colors[useColorScheme() ?? 'light'];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.title }]}>{title}</Text>
          
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <Pressable 
                key={item} 
                style={styles.modalItem} 
                onPress={() => onSelect(item)}
              >
                <Text style={[styles.itemText, { color: theme.title }]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', borderRadius: 24, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  modalItem: { width: '100%', paddingVertical: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  scrollContainer: { width: '100%', maxHeight: 280 },
  itemText: { fontWeight: '600' }
});
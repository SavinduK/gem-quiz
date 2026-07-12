import React from 'react';
import { Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../constants/theme';

interface DeleteModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteModal({ visible,  onCancel, onConfirm }: DeleteModalProps) {
  const theme = Colors[useColorScheme() ?? 'light'];
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.customModalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.customModalTitle, { color: theme.title }]}>Delete Dataset</Text>
          <Text style={[styles.customModalSub, { color: theme.subtext }]}>Are you sure you want to permanently delete this file?</Text>
          <View style={styles.customModalActions}>
            <Pressable style={styles.customModalBtn} onPress={onCancel}>
              <Text style={{ color: theme.subtext, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.customModalBtn, { backgroundColor: theme.delete }]} onPress={onConfirm}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', borderRadius: 24, padding: 20, alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
    modalItem: { width: '100%', paddingVertical: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    customModalContent: { width: '85%', padding: 25, borderRadius: 30, alignItems: 'center' },
    customModalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
    customModalSub: { textAlign: 'center', marginBottom: 25, lineHeight: 20 },
    customModalActions: { flexDirection: 'row', gap: 15 },
    customModalBtn: { flex: 1, padding: 15, borderRadius: 15, alignItems: 'center' }
});
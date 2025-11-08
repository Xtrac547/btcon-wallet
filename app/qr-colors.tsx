import '@/utils/shim';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQRColor } from '@/contexts/QRColorContext';
import { ArrowLeft, Check } from 'lucide-react-native';

const AVAILABLE_COLORS = [
  { name: 'Noir', value: '#000000' },
  { name: 'Blanc', value: '#FFFFFF' },
  { name: 'Orange', value: '#FF8C00' },
  { name: 'Rouge', value: '#FF4444' },
  { name: 'Bleu', value: '#4169E1' },
  { name: 'Vert', value: '#00C853' },
  { name: 'Violet', value: '#9C27B0' },
  { name: 'Rose', value: '#E91E63' },
  { name: 'Cyan', value: '#00BCD4' },
  { name: 'Jaune', value: '#FFD700' },
  { name: 'Gris Foncé', value: '#333333' },
  { name: 'Gris Clair', value: '#CCCCCC' },
];

export default function QRColorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;
  const { colors, saveColors } = useQRColor();

  const [selectedBackground, setSelectedBackground] = useState(colors.background);
  const [selectedQR, setSelectedQR] = useState(colors.qr);

  const handleSave = async () => {
    if (selectedBackground.toLowerCase() === selectedQR.toLowerCase()) {
      Alert.alert('Erreur', 'Les couleurs de fond et QR ne peuvent pas être identiques');
      return;
    }

    const result = await saveColors({
      background: selectedBackground,
      qr: selectedQR,
    });

    if (result.success) {
      Alert.alert('Succès', 'Couleurs enregistrées avec succès');
      router.back();
    } else {
      Alert.alert('Erreur', result.error || 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <ArrowLeft color="#FFF" size={20} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Couleurs QR Code</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40, maxWidth: isWideScreen ? 700 : width, width: '100%', alignSelf: 'center' },
        ]}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Couleur de fond</Text>
          <View style={styles.colorGrid}>
            {AVAILABLE_COLORS.map((color) => (
              <TouchableOpacity
                key={`bg-${color.value}`}
                style={[
                  styles.colorOption,
                  { backgroundColor: color.value },
                  selectedBackground === color.value && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedBackground(color.value)}
              >
                {selectedBackground === color.value && (
                  <View style={styles.checkmark}>
                    <Check color={color.value === '#FFFFFF' || color.value === '#FFD700' || color.value === '#CCCCCC' ? '#000' : '#FFF'} size={20} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Couleur QR Code</Text>
          <View style={styles.colorGrid}>
            {AVAILABLE_COLORS.map((color) => (
              <TouchableOpacity
                key={`qr-${color.value}`}
                style={[
                  styles.colorOption,
                  { backgroundColor: color.value },
                  selectedQR === color.value && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedQR(color.value)}
              >
                {selectedQR === color.value && (
                  <View style={styles.checkmark}>
                    <Check color={color.value === '#FFFFFF' || color.value === '#FFD700' || color.value === '#CCCCCC' ? '#000' : '#FFF'} size={20} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Aperçu</Text>
          <View style={[styles.preview, { backgroundColor: selectedBackground }]}>
            <View style={styles.previewQR}>
              <View style={[styles.previewBox, { backgroundColor: selectedQR }]} />
              <View style={[styles.previewBox, { backgroundColor: selectedQR }]} />
              <View style={[styles.previewBox, { backgroundColor: selectedQR }]} />
            </View>
            <View style={styles.previewQR}>
              <View style={[styles.previewBox, { backgroundColor: selectedQR }]} />
              <View style={styles.previewBoxEmpty} />
              <View style={[styles.previewBox, { backgroundColor: selectedQR }]} />
            </View>
            <View style={styles.previewQR}>
              <View style={[styles.previewBox, { backgroundColor: selectedQR }]} />
              <View style={[styles.previewBox, { backgroundColor: selectedQR }]} />
              <View style={[styles.previewBox, { backgroundColor: selectedQR }]} />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            selectedBackground.toLowerCase() === selectedQR.toLowerCase() && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={selectedBackground.toLowerCase() === selectedQR.toLowerCase()}
        >
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0A0A0A',
  },
  backButton: {
    padding: 4,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderColor: '#FF8C00',
    borderWidth: 3,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSection: {
    marginBottom: 32,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  previewQR: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBox: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  previewBoxEmpty: {
    width: 40,
    height: 40,
  },
  saveButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

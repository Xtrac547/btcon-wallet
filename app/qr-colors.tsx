import '@/utils/shim';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQRColor, QRStyle } from '@/contexts/QRColorContext';
import { ArrowLeft, Check, Square, Circle, Grid3x3 } from 'lucide-react-native';

const QR_STYLES = [
  { id: 'classic' as QRStyle, name: 'Classique', icon: Square, description: 'Carrés traditionnels' },
  { id: 'rounded' as QRStyle, name: 'Arrondi', icon: Circle, description: 'Coins arrondis modernes' },
  { id: 'dots' as QRStyle, name: 'Points', icon: Circle, description: 'Style pointillé' },
  { id: 'minimal' as QRStyle, name: 'Minimal', icon: Grid3x3, description: 'Design épuré' },
];

export default function QRStyleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;
  const { qrStyle, saveStyle } = useQRColor();

  const [selectedStyle, setSelectedStyle] = useState<QRStyle>(qrStyle);

  const handleSave = async () => {
    const result = await saveStyle(selectedStyle);

    if (result.success) {
      Alert.alert('Succès', 'Style enregistré avec succès');
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
        <Text style={styles.headerTitle}>Style QR Code</Text>
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
          <Text style={styles.sectionTitle}>Choisir un style</Text>
          <View style={styles.stylesGrid}>
            {QR_STYLES.map((style) => {
              const IconComponent = style.icon;
              return (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.styleCard,
                    selectedStyle === style.id && styles.styleCardSelected,
                  ]}
                  onPress={() => setSelectedStyle(style.id)}
                >
                  <View style={styles.styleIconContainer}>
                    <IconComponent 
                      color={selectedStyle === style.id ? '#FF8C00' : '#999'} 
                      size={32} 
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={[
                    styles.styleName,
                    selectedStyle === style.id && styles.styleNameSelected
                  ]}>
                    {style.name}
                  </Text>
                  <Text style={styles.styleDescription}>{style.description}</Text>
                  {selectedStyle === style.id && (
                    <View style={styles.selectedBadge}>
                      <Check color="#FF8C00" size={16} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Aperçu</Text>
          <View style={styles.preview}>
            <View style={styles.previewQR}>
              {selectedStyle === 'rounded' ? (
                <>
                  <View style={[styles.previewBox, styles.previewBoxRounded]} />
                  <View style={[styles.previewBox, styles.previewBoxRounded]} />
                  <View style={[styles.previewBox, styles.previewBoxRounded]} />
                </>
              ) : selectedStyle === 'dots' ? (
                <>
                  <View style={[styles.previewBox, styles.previewBoxDot]} />
                  <View style={[styles.previewBox, styles.previewBoxDot]} />
                  <View style={[styles.previewBox, styles.previewBoxDot]} />
                </>
              ) : selectedStyle === 'minimal' ? (
                <>
                  <View style={[styles.previewBox, styles.previewBoxMinimal]} />
                  <View style={[styles.previewBox, styles.previewBoxMinimal]} />
                  <View style={[styles.previewBox, styles.previewBoxMinimal]} />
                </>
              ) : (
                <>
                  <View style={styles.previewBox} />
                  <View style={styles.previewBox} />
                  <View style={styles.previewBox} />
                </>
              )}
            </View>
            <View style={styles.previewQR}>
              {selectedStyle === 'rounded' ? (
                <>
                  <View style={[styles.previewBox, styles.previewBoxRounded]} />
                  <View style={styles.previewBoxEmpty} />
                  <View style={[styles.previewBox, styles.previewBoxRounded]} />
                </>
              ) : selectedStyle === 'dots' ? (
                <>
                  <View style={[styles.previewBox, styles.previewBoxDot]} />
                  <View style={styles.previewBoxEmpty} />
                  <View style={[styles.previewBox, styles.previewBoxDot]} />
                </>
              ) : selectedStyle === 'minimal' ? (
                <>
                  <View style={[styles.previewBox, styles.previewBoxMinimal]} />
                  <View style={styles.previewBoxEmpty} />
                  <View style={[styles.previewBox, styles.previewBoxMinimal]} />
                </>
              ) : (
                <>
                  <View style={styles.previewBox} />
                  <View style={styles.previewBoxEmpty} />
                  <View style={styles.previewBox} />
                </>
              )}
            </View>
            <View style={styles.previewQR}>
              {selectedStyle === 'rounded' ? (
                <>
                  <View style={[styles.previewBox, styles.previewBoxRounded]} />
                  <View style={[styles.previewBox, styles.previewBoxRounded]} />
                  <View style={[styles.previewBox, styles.previewBoxRounded]} />
                </>
              ) : selectedStyle === 'dots' ? (
                <>
                  <View style={[styles.previewBox, styles.previewBoxDot]} />
                  <View style={[styles.previewBox, styles.previewBoxDot]} />
                  <View style={[styles.previewBox, styles.previewBoxDot]} />
                </>
              ) : selectedStyle === 'minimal' ? (
                <>
                  <View style={[styles.previewBox, styles.previewBoxMinimal]} />
                  <View style={[styles.previewBox, styles.previewBoxMinimal]} />
                  <View style={[styles.previewBox, styles.previewBoxMinimal]} />
                </>
              ) : (
                <>
                  <View style={styles.previewBox} />
                  <View style={styles.previewBox} />
                  <View style={styles.previewBox} />
                </>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
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
    fontWeight: '700' as const,
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
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  stylesGrid: {
    gap: 16,
  },
  styleCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    position: 'relative' as const,
  },
  styleCardSelected: {
    borderColor: '#FF8C00',
    backgroundColor: 'rgba(255, 140, 0, 0.05)',
  },
  styleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  styleName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  styleNameSelected: {
    color: '#FF8C00',
  },
  styleDescription: {
    color: '#888',
    fontSize: 14,
  },
  selectedBadge: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 140, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF8C00',
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
    backgroundColor: '#000000',
  },
  previewQR: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBox: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#FF8C00',
  },
  previewBoxRounded: {
    borderRadius: 12,
  },
  previewBoxDot: {
    borderRadius: 20,
  },
  previewBoxMinimal: {
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#FF8C00',
    backgroundColor: 'transparent',
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

  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
});

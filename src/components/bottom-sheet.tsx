import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/theme';
import { radius, spacing } from '@/theme/tokens';
import { IconButton, AppText } from './ui';

export function BottomSheet({
  visible, onClose, title, children,
}: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} accessibilityLabel="Close" />
      <View style={{
        backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
        paddingBottom: insets.bottom + spacing.lg, maxHeight: '85%', width: '100%', maxWidth: 720, alignSelf: 'center',
      }}>
        <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm }}>
          <AppText variant="heading" style={{ flex: 1 }}>{title}</AppText>
          <IconButton icon="close" size={34} background={colors.surfaceAlt} onPress={onClose} label="Close" />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

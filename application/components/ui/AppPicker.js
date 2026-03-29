import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../../lib/theme';
import { AppModal } from './AppModal';

/**
 * A modern, Modal-based dropdown picker for React Native.
 * Avoids native binary issues by using a pure JS modal.
 */
export function AppPicker({
  label,
  value,
  options = [],
  onSelect,
  placeholder = 'Select an option',
  error,
  disabled,
}) {
  const T = useTheme();
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find(o => String(o.id) === String(value));
  const displayText = selectedOption ? selectedOption.name : placeholder;

  const handleSelect = (id) => {
    onSelect(id);
    setVisible(false);
  };

  return (
    <View style={s.container}>
      {label && (
        <Text style={[s.label, { color: T.text, fontFamily: T.font }]}>{label}</Text>
      )}

      <TouchableOpacity
        style={[
          s.trigger,
          {
            backgroundColor: disabled ? T.bg : T.surfaceAlt,
            borderColor: error ? T.danger : T.border,
            opacity: disabled ? 0.8 : 1,
          },
          error && { backgroundColor: T.dangerBg },
        ]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[
          s.valueText,
          { color: selectedOption ? T.text : T.textFaint, fontFamily: T.font },
        ]}>
          {displayText}
        </Text>
        {!disabled && <ChevronDown size={18} color={T.textMuted} />}
      </TouchableOpacity>

      {error ? <Text style={[s.errorTxt, { color: T.danger }]}>{error}</Text> : null}

      <AppModal visible={visible} onClose={() => setVisible(false)} title={label || 'Select Option'}>
        <View style={s.listContainer}>
          {options.map((item) => {
            const isSelected = String(item.id) === String(value);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  s.optionItem,
                  { borderRadius: T.radius },
                  isSelected && { backgroundColor: T.primaryLight },
                ]}
                onPress={() => handleSelect(item.id)}
              >
                <Text style={[
                  s.optionText,
                  { color: isSelected ? T.primary : T.text, fontFamily: T.font },
                  isSelected && { fontWeight: '700' },
                ]}>
                  {item.name}
                </Text>
                {isSelected && <Check size={16} color={T.primary} strokeWidth={3} />}
              </TouchableOpacity>
            );
          })}
          {options.length === 0 && (
            <Text style={[s.emptyTxt, { color: T.textMuted }]}>No options available</Text>
          )}
        </View>
      </AppModal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginVertical: 4 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  errorTxt: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  listContainer: { paddingBottom: 20 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  optionText: { fontSize: 15 },
  emptyTxt: {
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});

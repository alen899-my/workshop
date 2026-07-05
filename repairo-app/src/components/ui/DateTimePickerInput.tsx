import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface DateTimePickerInputProps {
  label: string;
  value: string; // YYYY-MM-DD HH:mm
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  editable?: boolean;
}

export default function DateTimePickerInput({
  label,
  value,
  onChange,
  placeholder = 'Select Date & Time',
  icon = 'calendar-clock',
  editable = true,
}: DateTimePickerInputProps) {
  const theme = useTheme();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const parseValueToDate = (val: string): Date => {
    if (!val) return new Date();
    const parts = val.trim().split(/\s+/);
    if (parts.length >= 2) {
      const dateParts = parts[0].split('-');
      const timeParts = parts[1].split(':');
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      let hours = parseInt(timeParts[0], 10) || 0;
      const minutes = parseInt(timeParts[1], 10) || 0;

      if (parts.length === 3) {
        const ampm = parts[2].toUpperCase();
        if (ampm === 'PM' && hours < 12) {
          hours += 12;
        } else if (ampm === 'AM' && hours === 12) {
          hours = 0;
        }
      }

      const d = new Date(year, month, day, hours, minutes);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const handlePress = () => {
    if (!editable) return;
    const parsed = parseValueToDate(value);
    setCurrentDate(parsed);
    setShowDate(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDate(false);
    if (selectedDate) {
      const nextDate = new Date(currentDate);
      nextDate.setFullYear(selectedDate.getFullYear());
      nextDate.setMonth(selectedDate.getMonth());
      nextDate.setDate(selectedDate.getDate());
      setCurrentDate(nextDate);
      // Trigger time picker sequentially
      setTimeout(() => setShowTime(true), 150);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTime(false);
    if (selectedTime) {
      const nextDate = new Date(currentDate);
      nextDate.setHours(selectedTime.getHours());
      nextDate.setMinutes(selectedTime.getMinutes());
      setCurrentDate(nextDate);

      // Call onChange with formatted DD-MM-YYYY hh:mm AM/PM local format
      const pad = (num: number) => String(num).padStart(2, '0');
      const yyyy = nextDate.getFullYear();
      const mm = pad(nextDate.getMonth() + 1);
      const dd = pad(nextDate.getDate());
      
      let hours = nextDate.getHours();
      const minutes = pad(nextDate.getMinutes());
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hh = pad(hours);

      onChange(`${dd}-${mm}-${yyyy} ${hh}:${minutes} ${ampm}`);
    }
  };

  if (Platform.OS === 'web') {
    let webValue = '';
    if (value) {
      const parts = value.trim().split(/\s+/);
      if (parts.length >= 2) {
        const dateParts = parts[0].split('-');
        const timeParts = parts[1].split(':');
        let hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];
        
        if (parts.length === 3) {
          const ampm = parts[2].toUpperCase();
          if (ampm === 'PM' && hours < 12) {
            hours += 12;
          } else if (ampm === 'AM' && hours === 12) {
            hours = 0;
          }
        }
        const hh = String(hours).padStart(2, '0');
        webValue = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${hh}:${minutes}`;
      }
    }
    const handleWebChange = (e: any) => {
      const val = e.target.value; // YYYY-MM-DDTHH:mm
      if (val) {
        const parts = val.split(/[ T]/);
        const dateParts = parts[0].split('-');
        const timeParts = parts[1].split(':');
        
        let hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hh = String(hours).padStart(2, '0');
        
        onChange(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${hh}:${minutes} ${ampm}`);
      } else {
        onChange('');
      }
    };

    return (
      <View style={styles.wrapper}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <View
          style={[
            styles.inputContainer,
            { borderColor: theme.border, backgroundColor: theme.card },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={theme.textSecondary}
            style={styles.icon}
          />
          <input
            type="datetime-local"
            value={webValue}
            onChange={handleWebChange}
            disabled={!editable}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: theme.text,
              fontFamily: 'inherit',
              fontSize: '15px',
              fontWeight: '500',
              width: '100%',
              height: '100%',
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.inputContainer,
          {
            borderColor: theme.border,
            backgroundColor: theme.card,
            opacity: editable ? (pressed ? 0.8 : 1) : 0.65,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={theme.textSecondary}
          style={styles.icon}
        />
        <Text
          style={[
            styles.inputText,
            { color: value ? theme.text : theme.tabIconDefault },
          ]}
        >
          {value || placeholder}
        </Text>
      </Pressable>

      {/* Date Picker Dialog */}
      {showDate && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onValueChange={onDateChange}
        />
      )}

      {/* Time Picker Dialog */}
      {showTime && (
        <DateTimePicker
          value={currentDate}
          mode="time"
          display="default"
          is24Hour={false}
          onValueChange={onTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  icon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});

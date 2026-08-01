import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  error?: string;
  /** Show the password-toggle eye icon automatically */
  secureTextEntry?: boolean;
}

export function FloatingLabelInput({
  label,
  value,
  placeholder,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  error,
  ...props
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry ?? false);

  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const onBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? '#F87171' : '#E2E8F0', error ? '#EF4444' : '#3B66F6'],
  });

  const shadowOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputBox,
          { borderColor },
          isFocused && {
            shadowColor: error ? '#EF4444' : '#3B66F6',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity,
            shadowRadius: 8,
            elevation: 4,
          },
        ]}
      >
        {/* Floating label */}
        <View style={styles.labelBadge}>
          <Text style={[
            styles.labelText,
            isFocused && styles.labelFocused,
            !!error && styles.labelError,
          ]}>
            {label}
          </Text>
        </View>

        {/* Input row */}
        <View style={styles.row}>
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#B0BDD0"
            secureTextEntry={isSecure}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize ?? 'none'}
            autoCorrect={false}
            autoComplete="off"
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />

          {/* Eye toggle for password fields */}
          {secureTextEntry && (
            <Pressable
              onPress={() => setIsSecure(!isSecure)}
              hitSlop={8}
              style={styles.eyeBtn}
            >
              <MaterialCommunityIcons
                name={isSecure ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={isFocused ? '#3B66F6' : '#94A3B8'}
              />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {!!error && (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  inputBox: {
    minHeight: 58,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    backgroundColor: '#FAFBFF',
    position: 'relative',
  },
  labelBadge: {
    position: 'absolute',
    top: -9,
    left: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 5,
  },
  labelText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  labelFocused: {
    color: '#3B66F6',
  },
  labelError: {
    color: '#EF4444',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#1E293B',
    padding: 0,
    margin: 0,
  },
  eyeBtn: {
    paddingLeft: 10,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 4,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontFamily: 'Inter_500Medium',
  },
});

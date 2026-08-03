import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error Boundary Exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <MaterialCommunityIcons name="alert-decagram" size={64} color="#ef4444" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            Cortex encountered an unexpected error. Don't worry, your progress is saved.
          </Text>
          {this.state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} numberOfLines={3}>
                {this.state.error.toString()}
              </Text>
            </View>
          )}
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Reload Cortex</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f3f4f6',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    width: '100%',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 12,
    color: '#f87171',
    fontFamily: 'Platform',
  },
  button: {
    backgroundColor: '#84cc16',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#0d1117',
    fontSize: 15,
    fontWeight: '800',
  },
});

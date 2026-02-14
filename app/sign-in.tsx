import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, TextField } from '@/components/ui';
import { db } from '@/services/instant';

type Step = 'email' | 'code';

export default function SignInScreen() {
  const { user, isLoading } = db.useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  if (isLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-app-light dark:bg-app-dark">
        <ActivityIndicator colorClassName="text-primary" />
      </ThemedView>
    );
  }

  if (user) {
    return <Redirect href="/" />;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const sendMagicCode = async () => {
    if (!normalizedEmail) {
      setError('Enter an email address.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setFeedback('');
    try {
      await db.auth.sendMagicCode({ email: normalizedEmail });
      setStep('code');
      setFeedback(`We sent a code to ${normalizedEmail}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (!normalizedEmail) {
      setError('Enter an email address.');
      setStep('email');
      return;
    }

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Enter the code from your email.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setFeedback('');
    try {
      await db.auth.signInWithMagicCode({ email: normalizedEmail, code: trimmedCode });
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code.');
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (!normalizedEmail) {
      setError('Enter an email address.');
      setStep('email');
      return;
    }

    setSubmitting(true);
    setError(null);
    setFeedback('');
    try {
      await db.auth.sendMagicCode({ email: normalizedEmail });
      setFeedback(`A new code was sent to ${normalizedEmail}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView
      className="flex-1 bg-app-light dark:bg-app-dark"
      style={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
        paddingLeft: insets.left + 20,
        paddingRight: insets.right + 20,
      }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-2.5" keyboardShouldPersistTaps="handled">
          <ThemedText type="title">Sign in</ThemedText>
          <ThemedText className="mb-2">
            Use your email and a one-time code to access cards, profile, and settings.
          </ThemedText>

          <ThemedText type="subtitle" className="mt-1.5">
            Email
          </ThemedText>
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            className="mt-1.5"
            value={email}
          />

          {step === 'code' ? (
            <>
              <ThemedText type="subtitle" className="mt-1.5">
                Magic code
              </ThemedText>
              <TextField
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitting}
                keyboardType="number-pad"
                onChangeText={setCode}
                placeholder="123456"
                className="mt-1.5"
                textContentType="oneTimeCode"
                value={code}
              />
            </>
          ) : null}

          <Button
            loading={submitting}
            onPress={step === 'email' ? sendMagicCode : verifyCode}
            className="mt-3.5"
          >
            {step === 'email' ? 'Send code' : 'Verify and sign in'}
          </Button>

          {step === 'code' ? (
            <View className="mt-2 flex-row justify-between">
              <Button variant="link" loading={submitting} onPress={resendCode}>
                Resend code
              </Button>
              <Button
                variant="link"
                loading={submitting}
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                  setFeedback('');
                }}
              >
                Change email
              </Button>
            </View>
          ) : null}

          {feedback ? <ThemedText className="text-success">{feedback}</ThemedText> : null}
          {error ? <ThemedText className="text-danger">{error}</ThemedText> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/cn';

export type CardEditorValue = {
  title: string;
  frontText: string;
  backText: string;
  imageUris: string[];
};

type CardEditorErrors = {
  title?: string | null;
  frontText?: string | null;
  backText?: string | null;
};

type CardEditorFieldsProps = {
  value: CardEditorValue;
  onChange: (nextValue: CardEditorValue) => void;
  errors?: CardEditorErrors;
  disabled?: boolean;
};

const inputClassName =
  'mt-1.5 rounded-input border border-input-border-light bg-input-light px-2.5 py-2.5 text-fg-light dark:border-input-border-dark dark:bg-input-dark dark:text-fg-dark';

export function CardEditorFields({ value, onChange, errors, disabled = false }: CardEditorFieldsProps) {
  const [imageUri, setImageUri] = useState('');

  const onAddImage = () => {
    const nextUri = imageUri.trim();
    if (!nextUri) {
      return;
    }

    onChange({
      ...value,
      imageUris: [...value.imageUris, nextUri],
    });
    setImageUri('');
  };

  const onRemoveImage = (targetIndex: number) => {
    onChange({
      ...value,
      imageUris: value.imageUris.filter((_, index) => index !== targetIndex),
    });
  };

  return (
    <View className="gap-2.5">
      <ThemedText type="subtitle" className="mt-1.5">
        Title
      </ThemedText>
      <TextInput
        editable={!disabled}
        value={value.title}
        onChangeText={(title) => onChange({ ...value, title })}
        placeholder="Give this card a title"
        placeholderTextColorClassName="text-subtle-light dark:text-subtle-dark"
        className={cn(inputClassName, errors?.title && 'border-danger')}
      />
      {errors?.title ? <ThemedText className="mt-1 text-danger">{errors.title}</ThemedText> : null}

      <ThemedText type="subtitle" className="mt-1.5">
        Front
      </ThemedText>
      <TextInput
        editable={!disabled}
        value={value.frontText}
        onChangeText={(frontText) => onChange({ ...value, frontText })}
        placeholder="Write the front text"
        placeholderTextColorClassName="text-subtle-light dark:text-subtle-dark"
        className={cn(inputClassName, 'min-h-[120px]', errors?.frontText && 'border-danger')}
        style={{ textAlignVertical: 'top' }}
        multiline
      />
      {errors?.frontText ? <ThemedText className="mt-1 text-danger">{errors.frontText}</ThemedText> : null}

      <ThemedText type="subtitle" className="mt-1.5">
        Back
      </ThemedText>
      <TextInput
        editable={!disabled}
        value={value.backText}
        onChangeText={(backText) => onChange({ ...value, backText })}
        placeholder="Write the back text"
        placeholderTextColorClassName="text-subtle-light dark:text-subtle-dark"
        className={cn(inputClassName, 'min-h-[120px]', errors?.backText && 'border-danger')}
        style={{ textAlignVertical: 'top' }}
        multiline
      />
      {errors?.backText ? <ThemedText className="mt-1 text-danger">{errors.backText}</ThemedText> : null}

      <ThemedText type="subtitle" className="mt-1.5">
        Image URI (optional)
      </ThemedText>
      <View className="mt-1.5 flex-row items-center gap-2">
        <TextInput
          editable={!disabled}
          value={imageUri}
          onChangeText={setImageUri}
          placeholder="Paste image URL and tap Add"
          placeholderTextColorClassName="text-subtle-light dark:text-subtle-dark"
          className={cn('flex-1', inputClassName)}
        />
        <Pressable
          disabled={disabled}
          className={cn('rounded-input bg-link px-3 py-2.5', disabled && 'opacity-60')}
          onPress={onAddImage}
          style={({ pressed }) => ({ opacity: disabled ? 0.6 : pressed ? 0.92 : 1 })}
        >
          <ThemedText className="font-semibold text-white">Add</ThemedText>
        </Pressable>
      </View>

      {value.imageUris.length > 0 ? (
        <View className="mt-1.5 gap-2">
          {value.imageUris.map((uri, index) => (
            <View key={`${uri}-${index}`} className="flex-row items-center justify-between gap-2">
              <ThemedText numberOfLines={1} className="flex-1 opacity-80">
                {uri}
              </ThemedText>
              <Pressable onPress={() => onRemoveImage(index)} disabled={disabled}>
                <ThemedText className="font-semibold text-danger">Remove</ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

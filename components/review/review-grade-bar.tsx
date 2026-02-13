import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/cn';
import type { ReviewRating } from '@/types/card';

type ReviewGradeBarProps = {
  onGrade: (rating: ReviewRating) => void;
  disabled?: boolean;
};

type GradeButton = {
  rating: ReviewRating;
  label: string;
  className: string;
};

const gradeButtons: GradeButton[] = [
  { rating: 'again', label: 'Again', className: 'bg-danger-strong' },
  { rating: 'hard', label: 'Hard', className: 'bg-warning' },
  { rating: 'good', label: 'Good', className: 'bg-success' },
  { rating: 'easy', label: 'Easy', className: 'bg-info' },
];

export function ReviewGradeBar({ onGrade, disabled = false }: ReviewGradeBarProps) {
  return (
    <View className="mt-[18px] flex-row flex-wrap gap-2.5">
      {gradeButtons.map((button) => (
        <Pressable
          key={button.rating}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onGrade(button.rating)}
          className={cn(
            'min-w-[120px] flex-1 items-center rounded-control px-2.5 py-3',
            button.className,
            disabled && 'opacity-60'
          )}
          style={({ pressed }) => ({ opacity: disabled ? 0.6 : pressed ? 0.92 : 1 })}
        >
          <ThemedText className="font-semibold text-white">{button.label}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

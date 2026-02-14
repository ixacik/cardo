import { View } from 'react-native';

import { Button } from '@/components/ui';
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
        <Button
          key={button.rating}
          disabled={disabled}
          onPress={() => onGrade(button.rating)}
          className={`min-w-[120px] flex-1 px-2.5 ${button.className}`}
        >
          {button.label}
        </Button>
      ))}
    </View>
  );
}

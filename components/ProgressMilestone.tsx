'use client';

interface ProgressMilestoneProps {
  percentage: number;
  subjectName: string;
}

export default function ProgressMilestone({ percentage, subjectName }: ProgressMilestoneProps) {
  const getMilestone = (percent: number) => {
    if (percent >= 100) return { emoji: '🏆', message: 'Champion!', color: 'text-yellow-500' };
    if (percent >= 75) return { emoji: '⭐', message: 'Almost there!', color: 'text-purple-500' };
    if (percent >= 50) return { emoji: '🌟', message: 'Halfway there!', color: 'text-blue-500' };
    if (percent >= 25) return { emoji: '🌱', message: 'Growing strong!', color: 'text-green-500' };
    return { emoji: '🌺', message: 'Just started!', color: 'text-pink-500' };
  };

  const milestone = getMilestone(percentage);

  return (
    <div className="flex items-center space-x-2">
      <span className={`text-2xl animate-bounce ${milestone.color}`}>
        {milestone.emoji}
      </span>
      <span className={`text-sm font-medium ${milestone.color}`}>
        {milestone.message}
      </span>
    </div>
  );
}


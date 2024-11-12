import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollProps {
  question: string;
  options: PollOption[];
  onVote: (optionId: string) => void;
  totalVotes: number;
}

const PollComponent: React.FC<PollProps> = ({
  question,
  options,
  onVote,
  totalVotes,
}) => {
  const [voted, setVoted] = useState<string | null>(null);

  const handleVote = (optionId: string) => {
    if (!voted) {
      setVoted(optionId);
      onVote(optionId);
    }
  };

  const calculatePercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-lg">
      <div className="flex items-center mb-6">
        <BarChart3 className="w-6 h-6 mr-3" />
        <h2 className="text-2xl font-bold">{question}</h2>
      </div>

      <div className="space-y-4">
        {options.map((option) => (
          <div key={option.id} className="relative">
            <button
              onClick={() => handleVote(option.id)}
              disabled={voted !== null}
              className="w-full p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors relative z-10"
            >
              <div className="flex justify-between items-center">
                <span>{option.text}</span>
                <span>{calculatePercentage(option.votes)}%</span>
              </div>
              {voted && (
                <div
                  className="absolute top-0 left-0 h-full bg-blue-600 opacity-20 rounded-lg transition-all"
                  style={{ width: `${calculatePercentage(option.votes)}%` }}
                />
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-gray-400">
        Total votes: {totalVotes}
      </div>
    </div>
  );
};

export default PollComponent;
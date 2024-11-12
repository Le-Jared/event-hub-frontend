import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/shadcn/ui/button';
import { Progress } from '@/components/shadcn/ui/progress';
import { ScrollArea } from '@/components/shadcn/ui/scroll-area';
import { Card } from '@/components/shadcn/ui/card';

interface PollOption {
  id: number;
  text: string;
  votes: number;
}

interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
}

interface PollComponentProps {
  onVote?: (optionId: number) => void;
}

const PollComponent: React.FC<PollComponentProps> = ({ onVote }) => {
  const [currentPoll, setCurrentPoll] = useState<Poll>({
    question: "What topic would you like to discuss next?",
    options: [
      { id: 1, text: "Technical Implementation", votes: 12 },
      { id: 2, text: "Design Principles", votes: 8 },
      { id: 3, text: "User Experience", votes: 15 },
      { id: 4, text: "Performance Optimization", votes: 7 },
    ],
    totalVotes: 42
  });
  const [userVote, setUserVote] = useState<number | null>(null);

  const handleVote = (optionId: number) => {
    if (userVote === null) {
      setUserVote(optionId);
      setCurrentPoll(prev => ({
        ...prev,
        options: prev.options.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ),
        totalVotes: prev.totalVotes + 1
      }));
      onVote?.(optionId);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-white">Live Poll</h3>
        </div>
        
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-4">
            <p className="text-sm font-medium text-white">{currentPoll.question}</p>
            
            <div className="space-y-2">
              {currentPoll.options.map((option) => {
                const percentage = Math.round((option.votes / currentPoll.totalVotes) * 100) || 0;
                
                return (
                  <div key={option.id} className="space-y-1">
                    <Button
                      variant={userVote === option.id ? "secondary" : "outline"}
                      className="w-full justify-between text-left"
                      onClick={() => handleVote(option.id)}
                      disabled={userVote !== null}
                    >
                      <span>{option.text}</span>
                      <span className="text-sm">{percentage}%</span>
                    </Button>
                    <Progress value={percentage} className="h-1" />
                  </div>
                );
              })}
            </div>
            
            <div className="text-sm text-gray-400 text-center">
              Total votes: {currentPoll.totalVotes}
            </div>
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};

export default PollComponent;
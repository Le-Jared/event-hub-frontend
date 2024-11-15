import React from 'react';
import { useQuestions } from '../contexts/QuestionContext';
import { Card } from "@/components/shadcn/ui/card";
import { ScrollArea } from "@/components/shadcn/ui/scroll-area";
import { ChevronUp, Clock } from "lucide-react";
import { Question } from '../types/types';

const SelectedQuestionDisplay: React.FC<{ question: Question | null }> = ({ question }) => {
  if (!question) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg p-4">
        <p className="text-gray-400">Select a question to display</p>
      </div>
    );
  }

  return (
    <Card className="h-full bg-gray-800 p-6">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-600 px-4 py-2 rounded-lg">
            <span className="text-2xl font-bold">{question.votes}</span>
            <span className="text-sm ml-1">votes</span>
          </div>
        </div>
        <p className="text-xl font-semibold flex-1">{question.text}</p>
        <div className="mt-4">
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {new Date(question.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </Card>
  );
};

const PigeonPage: React.FC = () => {
  const { questions, handleVote, handleSelectQuestion } = useQuestions();
  const selectedQuestion = questions.find(q => q.isSelected) || null; // Convert undefined to null

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Pigeon Page</h1>
      <div className="flex flex-1 gap-4">
        {/* Left side - Selected Question */}
        <div className="w-1/2">
          <SelectedQuestionDisplay question={selectedQuestion} />
        </div>

        {/* Right side - Question List */}
        <div className="w-1/2">
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {questions.map((question: Question) => (
                <Card
                  key={question.id}
                  className={`p-4 transition-all duration-200 cursor-pointer ${
                    question.isSelected 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => handleSelectQuestion(question)}
                >
                  <div className="flex gap-4">
                    <button
                      className={`flex flex-col items-center min-w-[60px] p-2 rounded ${
                        question.hasVoted ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(question.id);
                      }}
                    >
                      <ChevronUp className="h-5 w-5" />
                      <span className="text-sm font-semibold">{question.votes}</span>
                    </button>
                    <div className="flex-1">
                      <p className="text-md">{question.text}</p>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(question.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default PigeonPage;
import React, { useState } from 'react';
import { Card } from "@/components/shadcn/ui/card";
import { ScrollArea } from "@/components/shadcn/ui/scroll-area";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { ChevronUp, MessageSquarePlus, Bird, Clock } from "lucide-react";
import { useQuestions } from '../../contexts/QuestionContext';

const QuestionComponent: React.FC = () => {
  const { questions, handleVote, handleSelectQuestion, addQuestion } = useQuestions();
  const [newQuestion, setNewQuestion] = useState('');

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestion.trim()) {
      addQuestion(newQuestion.trim());
      setNewQuestion('');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-gray-900 rounded-lg shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-800 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
            <Bird className="h-6 w-6 text-blue-400" />
            Pigeon Hole
          </h3>
        </div>
      </div>

      {/* Questions List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {questions.map((question) => (
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
                <Button
                  variant={question.hasVoted ? "secondary" : "ghost"}
                  size="sm"
                  className={`flex flex-col items-center min-w-[60px] ${
                    question.hasVoted ? 'bg-blue-500 hover:bg-blue-600' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(question.id);
                  }}
                >
                  <ChevronUp className="h-5 w-5" />
                  <span className="text-sm font-semibold">{question.votes}</span>
                </Button>
                <div className="flex-1">
                  <p className="text-md text-white">{question.text}</p>
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

      {/* Question Input */}
      <div className="p-4 border-t border-gray-800 bg-gray-800 rounded-b-lg">
        <form onSubmit={handleSubmitQuestion} className="flex gap-2">
          <Input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MessageSquarePlus className="h-5 w-5 mr-2" />
            Ask
          </Button>
        </form>
      </div>
    </div>
  );
};

export default QuestionComponent;
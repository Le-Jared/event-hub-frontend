import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideProps {
  title: string;
  content: string[];
  currentSlide?: number;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
}

const SlideComponent: React.FC<SlideProps> = ({
  title,
  content,
  currentSlide = 0,
  onNextSlide,
  onPrevSlide,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <div className="text-sm text-gray-400">
          Slide {currentSlide + 1} of {content.length}
        </div>
      </div>
      
      <div className="min-h-[400px] bg-gray-700 rounded-lg p-6 mb-6">
        <div className="prose prose-invert max-w-none">
          {content[currentSlide]}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <button
          onClick={onPrevSlide}
          disabled={currentSlide === 0}
          className="flex items-center px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Previous
        </button>
        
        <button
          onClick={onNextSlide}
          disabled={currentSlide === content.length - 1}
          className="flex items-center px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50"
        >
          Next
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default SlideComponent;
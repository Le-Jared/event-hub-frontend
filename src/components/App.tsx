import React from 'react';
import ReactDOMRun from "../routes/ReactDOMRun";
import { useAppContext } from "@/contexts/AppContext";

const App: React.FC = () => {
  const { isLoggedIn } = useAppContext();

  return (
    <div className="w-full h-screen bg-black">
      <ReactDOMRun />
    </div>
  );
};

export default App;
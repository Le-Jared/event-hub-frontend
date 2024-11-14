import React, { useEffect, useState } from 'react';
import PollResult from '@/components/PollResult';
import PollView from '@/components/PollView';
import { PollResponse } from '../host/HostCreatePoll';
import { ModuleAction } from '../EventPage';

interface PollComponentProps {
  roomId: string;
  isHost: boolean;
  pollMode: "vote" | "result";
  poll: PollResponse;
  setPoll: (poll: PollResponse) => void;
  setPollMode: (pollMode: "vote" | "result") => void;
  voteAction?: ModuleAction;
  onVoteSubmit?:  (pollId: number, optionId: number) => void;
  changeToResultViewForViewers?: () => void;
}

const PollComponent: React.FC<PollComponentProps> = ({ roomId, isHost, voteAction, pollMode, poll, setPollMode, onVoteSubmit, changeToResultViewForViewers}) => {
  const [count, setCount] = useState(0);

  function handleClick() {
    console.log(count + 1);
    setCount(count + 1);
  }
  
  useEffect(() => {
    console.log("va", voteAction);
    if (voteAction?.CONTENT) {
      const ids = voteAction.CONTENT.split("_");
      incrementVote(Number(ids[0]), Number(ids[1]));
      handleClick();
    }
  }, [voteAction])

  const incrementVote = (pollId: number, pollOptionId: number) => {
    if (poll) {
      console.log("increment vote for " + pollId);
      poll.pollOptionList.filter(option => pollOptionId == option.pollOptionId).forEach(
        function(op) {
          op.voteCount = op.voteCount + 1;
        }
      );
    }
  }

  const changeToResult = () => {
    if (changeToResultViewForViewers) {
      changeToResultViewForViewers();
    }
  }
  const switchToPollResult = () => {
    setPollMode("result");
  }

  return (
    <div>
      {pollMode === "result" && (
        <PollResult 
          poll={poll} 
          totalVotes={count}
          isHost={isHost}
          changeToResult={changeToResult}
        />
      )}
      {pollMode === "vote" && (
        <PollView 
          poll={poll}
          roomID={roomId}
          isHost={isHost}
          onClickViewResult={switchToPollResult}
          onVoteSubmit={onVoteSubmit}
        />
      )}
    </div>
   
  );
};

export default PollComponent;
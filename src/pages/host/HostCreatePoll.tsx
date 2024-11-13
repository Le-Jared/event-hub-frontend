import React, { useState } from 'react';
import { useAppContext } from "@/contexts/AppContext";
import PollForm, { ImageObject, PollOption, PollOptionRequestData, PollRequestData } from '@/components/PollForm';
import { Button } from '@/components/shadcn/ui/button';
import { useParams } from 'react-router-dom';
import { createPoll, getEventPoll, uploadImage } from '@/utils/api-client';

export type EventResponse = {
  id: number;
  partyName: string;
  scheduledDate: string;
  scheduledTime: string;
  code: string;
  createdDate: number[];
};

export type PollResponseData = {
    id: number;
    question: string;
};
  
export type PollOptionResponseData = {
    id?: number;
    value: string;
    description: string;
    imageUrl: string;
};

export type UpdatePollOptionRequestData = {
    id: number;
    imageUrl: string;
};

export type PollResponse = {
  pollId: number;
  pollQuestion: string;
  pollOptionList: PollOptionResponse[];
  voted: boolean;
  selectedPollOption: PollOptionResponse;
}

export type PollOptionResponse = {
  pollOptionId: number;
  value: string;
  description: string;
  imageUrl: string;
  voteCount: number;
}
  
const HostCreatePoll: React.FC = () => {
  
  const { roomId } = useParams<{ roomId: string }>();
  const [question, setQuestion] = useState<string>('');
  const [optionSize, setOptionSize] = useState<number>(2);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    {
      id: 0,
      value: "",
      description: "",
      image: null,
      imageOptionUrl: ""
    },
    {
      id: 0,
      value: "",
      description: "",
      image: null,
      imageOptionUrl: ""
    }
  ]);
  
  const { user } = useAppContext();
  const [error, setError] = useState<string>('');
  const [isPollCreated, setIsPollCreated] = useState<boolean>(false);
  const [imageList, setImageList] = useState<ImageObject[]>([
    {
      image: null,
      imageUrl: ""
    },
    {
      image: null,
      imageUrl: ""
    }
  ]);

  const arePollOptionsUnique =(): boolean => {
    let uniqueOptionsList: string[] = [];

    for(let i=0; i<optionSize; i++) {
        // if option is not available push it to the list
        if (uniqueOptionsList.indexOf(pollOptions[i].value) === -1) {
            uniqueOptionsList.push(pollOptions[i].value);
        } else {
            //return false once a duplicate is found
            return false;
        }
    }
    return true;
  }

const onPollCreate = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const accountID = user?.id;
    const roomID = roomId ? roomId : '';
    const username = user?.username != undefined ? user.username : "Anonymous";
  
    if (!accountID) {
      setError('User not logged in. Please log in to create a watch party.');
      return;
    }

    if (!arePollOptionsUnique()) {
        setError("Duplicate values set for options. Please check and change to unique ones.");
        return;
    }

    let optionRequestsData: PollOptionRequestData[] = [];
      for (let i=0; i<optionSize; i++) {
        const {
          value,
          description,
          image
        } = pollOptions[i];
        const request: PollOptionRequestData = {
          value,
          description,
          image,
          fileName: image?.name
        }
        optionRequestsData.push(request);
      }

      console.log(roomID, "ROOMID");
      const pollRequestData: PollRequestData = {
        eventCode: roomID,
        question: question,
        pollOptionRequests: optionRequestsData
      };

      try {
        // api call to create a poll
        await createPoll(pollRequestData);

        // api call to get created poll
        const response = await getEventPoll(roomID, username);
        
        // api call to upload images to server
        for (var i=0; i<imageList.length; i++) {
          // upload images and save image url
          const optionImage: File| null | undefined = imageList[i].image ? imageList[i].image  : null;
          if (optionImage) {
            const newImageUrl: string | undefined = response.pollOptionList[i].imageUrl;
            if (newImageUrl) {
              uploadImage(optionImage, newImageUrl, "pollOptionImages");
            }
          }
        }

      } catch (error) {
        console.error('Error creating poll:', error);
        setError('Failed to create poll. Please try again.');
      } finally {
        setIsPollCreated(true);
      }
  }

  return (
    <div className="container mx-auto px-4 py-8">
       <h1 className="text-2xl font-bold mb-6 text-white">Create Poll</h1>
        <form className='space-y-4' onSubmit={onPollCreate}>
            <PollForm 
              question={question}
              setQuestion={setQuestion}
              optionSize={optionSize}
              setOptionSize={setOptionSize}
              pollOptions={pollOptions}
              setPollOptions={setPollOptions}
              imageList={imageList}
              setImageList={setImageList}
            />
            <Button
              type="submit"
              variant="secondary"
              className="w-full text-base py-2 font-alatsi"
            >
              Create Poll
            </Button>
        </form>
       {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}
       {isPollCreated && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <p>Poll successfully created!</p>
        </div>
      )}
    </div>
  );
};

export default HostCreatePoll;
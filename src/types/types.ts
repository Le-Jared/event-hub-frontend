export interface Question {
    id: string;
    text: string;
    votes: number;
    hasVoted: boolean;
    isSelected: boolean;
    timestamp: Date;
    }
    
export type SortType = 'votes' | 'time';
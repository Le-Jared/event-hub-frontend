declare module 'simple-peer-light' {
  interface SimplePeerOptions {
    initiator?: boolean;
    channelConfig?: object;
    channelName?: string;
    config?: RTCConfiguration;
    offerConstraints?: RTCOfferOptions;
    answerConstraints?: RTCAnswerOptions;
    sdpTransform?: (sdp: any) => any;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    allowHalfTrickle?: boolean;
    objectMode?: boolean;
    wrtc?: object;
  }

  class SimplePeer {
    constructor(opts?: SimplePeerOptions);
    
    signal(data: any): void;
    destroy(err?: Error): void;
    
    on(event: 'signal', listener: (data: any) => void): this;
    on(event: 'connect', listener: () => void): this;
    on(event: 'data', listener: (data: any) => void): this;
    on(event: 'stream', listener: (stream: MediaStream) => void): this;
    on(event: 'track', listener: (track: MediaStreamTrack, stream: MediaStream) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
  }

  export = SimplePeer;
}

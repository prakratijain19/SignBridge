import type {
  CallDataMessage,
  IceServerConfig,
  RtcIceCandidate,
  SignalMessage,
} from '@signbridge/shared-types';

const DATA_CHANNEL_LABEL = 'sb-data';

export interface PeerCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onData: (msg: CallDataMessage) => void;
  /** Emit a signaling message to the peer (offer/answer/ice-candidate). */
  onSignal: (msg: SignalMessage) => void;
  onConnectionState: (state: RTCPeerConnectionState) => void;
}

/**
 * Wraps an RTCPeerConnection plus the "sb-data" data channel used for captions
 * and sign text. The initiator (the existing room occupant) creates the offer
 * and the data channel; the answerer listens for both.
 */
export class PeerConnection {
  private pc: RTCPeerConnection;
  private dc: RTCDataChannel | null = null;

  constructor(
    iceServers: IceServerConfig[],
    private readonly cb: PeerCallbacks,
  ) {
    this.pc = new RTCPeerConnection({ iceServers });
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.cb.onSignal({ type: 'ice-candidate', candidate: e.candidate.toJSON() });
      }
    };
    this.pc.ontrack = (e) => {
      if (e.streams[0]) this.cb.onRemoteStream(e.streams[0]);
    };
    this.pc.onconnectionstatechange = () => this.cb.onConnectionState(this.pc.connectionState);
    this.pc.ondatachannel = (e) => this.setupChannel(e.channel);
  }

  addLocalStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => this.pc.addTrack(track, stream));
  }

  /** Initiator only: open the data channel before creating the offer. */
  openDataChannel(): void {
    this.setupChannel(this.pc.createDataChannel(DATA_CHANNEL_LABEL));
  }

  private setupChannel(channel: RTCDataChannel): void {
    this.dc = channel;
    channel.onmessage = (e) => {
      try {
        this.cb.onData(JSON.parse(e.data as string) as CallDataMessage);
      } catch {
        // Ignore malformed data-channel payloads.
      }
    };
  }

  send(msg: CallDataMessage): void {
    if (this.dc && this.dc.readyState === 'open') this.dc.send(JSON.stringify(msg));
  }

  async createOffer(): Promise<SignalMessage> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return { type: 'offer', sdp: offer.sdp ?? '' };
  }

  async handleOffer(sdp: string): Promise<SignalMessage> {
    await this.pc.setRemoteDescription({ type: 'offer', sdp });
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return { type: 'answer', sdp: answer.sdp ?? '' };
  }

  async handleAnswer(sdp: string): Promise<void> {
    await this.pc.setRemoteDescription({ type: 'answer', sdp });
  }

  async addIceCandidate(candidate: RtcIceCandidate): Promise<void> {
    try {
      await this.pc.addIceCandidate(candidate);
    } catch {
      // Candidates can arrive before remote description; browsers buffer most.
    }
  }

  close(): void {
    this.dc?.close();
    this.pc.getSenders().forEach((s) => s.track?.stop());
    this.pc.close();
  }
}

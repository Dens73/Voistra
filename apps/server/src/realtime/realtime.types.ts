export type AuthPayload = {
  sub: string;
  username: string;
};

export type VoiceParticipant = {
  socketId: string;
  userId: string;
  username: string;
  muted: boolean;
  deafened: boolean;
  speaking: boolean;
  pushToTalkActive: boolean;
  voiceActivationActive: boolean;
};

export type NetworkMetrics = {
  rtt?: number;
  jitter?: number;
  packetLoss?: number;
  bitrate?: number;
  updatedAt: string;
};

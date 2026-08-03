import API from './axios';

const AGORA_APP_ID = '57f1b0fb4940493faf15457d2388d722'; // Same as VoiceCallContext

export interface LiveStream {
  channelName: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  viewerCount: number;
  startedAt: string;
}

/** Generate Agora token for live streaming (broadcaster or audience) */
export const generateLiveToken = async (
  channelName: string,
  uid: number,
  role: 'publisher' | 'subscriber'
): Promise<{ token: string; appId: string }> => {
  const res = await API.post('/agora/token', { channelName, uid, role });
  return { token: res.data.token, appId: res.data.appId || AGORA_APP_ID };
};

/** Fetch all currently active live streams from in-memory server store */
export const getActiveStreamsAPI = async (): Promise<LiveStream[]> => {
  const res = await API.get('/agora/active-streams');
  return res.data.streams || [];
};

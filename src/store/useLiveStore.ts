import { create } from 'zustand';

export interface LiveComment {
  userId: string;
  username: string;
  avatar?: string;
  text: string;
  time: string;
}

export interface ActiveStream {
  channelName: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  viewerCount: number;
  startedAt: string;
}

interface LiveState {
  // Broadcast (host)
  isLive: boolean;
  liveChannelName: string | null;
  liveDuration: number; // seconds

  // Viewing
  isViewing: boolean;
  viewingStream: ActiveStream | null;

  // Shared
  comments: LiveComment[];
  viewerCount: number;

  // Discovery
  activeStreams: ActiveStream[];

  // Actions
  startLive: (channelName: string) => void;
  endLive: () => void;
  startViewing: (stream: ActiveStream) => void;
  stopViewing: () => void;
  addComment: (comment: LiveComment) => void;
  loadHistory: (comments: LiveComment[]) => void;
  setViewerCount: (count: number) => void;
  setActiveStreams: (streams: ActiveStream[]) => void;
  incrementDuration: () => void;
  resetDuration: () => void;
}

const useLiveStore = create<LiveState>((set) => ({
  isLive: false,
  liveChannelName: null,
  liveDuration: 0,

  isViewing: false,
  viewingStream: null,

  comments: [],
  viewerCount: 0,
  activeStreams: [],

  startLive: (channelName) =>
    set({ isLive: true, liveChannelName: channelName, comments: [], viewerCount: 0, liveDuration: 0 }),

  endLive: () =>
    set({ isLive: false, liveChannelName: null, comments: [], viewerCount: 0, liveDuration: 0 }),

  startViewing: (stream) =>
    set({ isViewing: true, viewingStream: stream, comments: [], viewerCount: stream.viewerCount }),

  stopViewing: () =>
    set({ isViewing: false, viewingStream: null, comments: [], viewerCount: 0 }),

  addComment: (comment) =>
    set((state) => {
      // Keep max 80 comments in UI (older ones drop off top)
      const updated = [...state.comments, comment];
      return { comments: updated.length > 80 ? updated.slice(-80) : updated };
    }),

  loadHistory: (comments) => set({ comments }),

  setViewerCount: (count) => set({ viewerCount: count }),

  setActiveStreams: (streams) => set({ activeStreams: streams }),

  incrementDuration: () => set((state) => ({ liveDuration: state.liveDuration + 1 })),

  resetDuration: () => set({ liveDuration: 0 }),
}));

export default useLiveStore;

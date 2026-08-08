import { create } from "zustand";
import { ITrack } from "@/shared/types/track";

export type PlaybackContext =
  | { type: "popular" }
  | { type: "search"; query: string }
  | { type: "album"; id: number }
  | { type: "favorites" }
  | { type: "playlist"; id: number }
  | { type: "genre"; id: number }
  | { type: "author"; id: number };

export interface PlaybackQueue {
  context: PlaybackContext;
  tracks: ITrack[];
}

interface PlaybackState {
  active: ITrack | null;
  queue: ITrack[];
  context: PlaybackContext | null;
  shuffleOrder: number[];
  currentTime: number;
  duration: number;
  volume: number;
  pause: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  playbackRequest: number;
}

interface PlaybackStore extends PlaybackState {
  playTrack: () => void;
  pauseTrack: () => void;
  togglePause: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  adjustVolume: (delta: number) => void;
  setDuration: (duration: number) => void;
  playFromQueue: (track: ITrack, tracks: ITrack[], context: PlaybackContext) => void;
  replaceQueue: (tracks: ITrack[], context: PlaybackContext) => void;
  removeTracks: (trackIds: number[]) => void;
  removeAuthorCatalog: (authorId: number) => void;
  next: () => void;
  previous: () => void;
  restart: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const uniqueTracks = (tracks: ITrack[]) => {
  const trackIds = new Set<number>();
  return tracks.filter((track) => {
    if (trackIds.has(track.id)) return false;
    trackIds.add(track.id);
    return true;
  });
};

const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};

const createOrder = (tracks: ITrack[], activeId: number | undefined, shuffled: boolean) => {
  const trackIds = tracks.map((track) => track.id);
  if (!shuffled) return trackIds;

  if (activeId === undefined || !trackIds.includes(activeId)) return shuffle(trackIds);

  return [activeId, ...shuffle(trackIds.filter((trackId) => trackId !== activeId))];
};

const isSameContext = (left: PlaybackContext | null, right: PlaybackContext) => {
  if (!left || left.type !== right.type) return false;

  switch (left.type) {
    case "album":
      return right.type === "album" && left.id === right.id;
    case "playlist":
      return right.type === "playlist" && left.id === right.id;
    case "genre":
      return right.type === "genre" && left.id === right.id;
    case "author":
      return right.type === "author" && left.id === right.id;
    case "favorites":
      return right.type === "favorites";
    case "search":
      return right.type === "search" && left.query === right.query;
    case "popular":
      return true;
  }
};

const setActiveTrack = (state: PlaybackState, track: ITrack) => {
  const isSameTrack = state.active?.id === track.id && state.active.audio === track.audio;

  return {
    active: track,
    currentTime: 0,
    duration: isSameTrack ? state.duration : 0,
    pause: false,
    playbackRequest: state.playbackRequest + 1,
  };
};

export const usePlaybackStore = create<PlaybackStore>((set) => ({
  active: null,
  queue: [],
  context: null,
  shuffleOrder: [],
  currentTime: 0,
  duration: 0,
  volume: 50,
  pause: true,
  isShuffle: false,
  isRepeat: false,
  playbackRequest: 0,

  playTrack: () => set({ pause: false }),
  pauseTrack: () => set({ pause: true }),
  togglePause: () => set((state) => ({ pause: !state.pause })),
  setCurrentTime: (time) => set({ currentTime: Number.isFinite(time) && time >= 0 ? time : 0 }),
  setVolume: (volume) => set({ volume: clamp(Math.round(volume), 0, 100) }),
  adjustVolume: (delta) => set((state) => ({ volume: clamp(state.volume + delta, 0, 100) })),
  setDuration: (duration) => set({ duration: Number.isFinite(duration) && duration >= 0 ? Math.ceil(duration) : 0 }),

  playFromQueue: (track, tracks, context) =>
    set((state) => {
      const queue = uniqueTracks(tracks);
      if (!queue.some((queueTrack) => queueTrack.id === track.id)) queue.unshift(track);

      const selectedTrack = queue.find((queueTrack) => queueTrack.id === track.id) ?? track;
      return {
        ...setActiveTrack(state, selectedTrack),
        queue,
        context,
        shuffleOrder: createOrder(queue, selectedTrack.id, state.isShuffle),
      };
    }),

  replaceQueue: (tracks, context) =>
    set((state) => {
      if (!isSameContext(state.context, context)) return {};

      const queue = uniqueTracks(tracks);
      return {
        queue,
        shuffleOrder: createOrder(queue, state.active?.id, state.isShuffle),
      };
    }),

  removeTracks: (trackIds) =>
    set((state) => {
      const removed = new Set(trackIds);
      const queue = state.queue.filter((track) => !removed.has(track.id));
      const shuffleOrder = state.shuffleOrder.filter((id) => !removed.has(id));

      if (!state.active || !removed.has(state.active.id))
        return { queue, shuffleOrder };

      if (queue.length === 0)
        return {
          active: null,
          queue: [],
          context: null,
          shuffleOrder: [],
          currentTime: 0,
          duration: 0,
          pause: true,
          playbackRequest: state.playbackRequest + 1,
        };

      const order = state.isShuffle && state.shuffleOrder.length
        ? state.shuffleOrder
        : state.queue.map((track) => track.id);
      const activeIndex = order.indexOf(state.active.id);
      const nextId = Array.from({ length: order.length }, (_, offset) =>
        order[(Math.max(activeIndex, 0) + offset + 1) % order.length],
      ).find((id) => !removed.has(id));
      const nextTrack = queue.find((track) => track.id === nextId) ?? queue[0];

      return {
        ...setActiveTrack(state, nextTrack),
        queue,
        shuffleOrder: createOrder(queue, nextTrack.id, state.isShuffle),
      };
    }),

  removeAuthorCatalog: (authorId) =>
    set((state) => {
      const removed = new Set(
        state.queue
          .filter((track) => track.authorId === authorId)
          .map((track) => track.id),
      );
      const withoutCredit = (track: ITrack) => ({
        ...track,
        featuredAuthors: track.featuredAuthors?.filter(
          (author) => author.id !== authorId,
        ),
      });
      const queue = state.queue
        .filter((track) => !removed.has(track.id))
        .map(withoutCredit);
      const shuffleOrder = state.shuffleOrder.filter((id) => !removed.has(id));
      const active = state.active ? withoutCredit(state.active) : null;

      if (!state.active || !removed.has(state.active.id))
        return { active, queue, shuffleOrder };
      if (!queue.length)
        return {
          active: null,
          queue: [],
          context: null,
          shuffleOrder: [],
          currentTime: 0,
          duration: 0,
          pause: true,
          playbackRequest: state.playbackRequest + 1,
        };

      const order = state.isShuffle && state.shuffleOrder.length
        ? state.shuffleOrder
        : state.queue.map((track) => track.id);
      const activeIndex = order.indexOf(state.active.id);
      const nextId = Array.from({ length: order.length }, (_, offset) =>
        order[(Math.max(activeIndex, 0) + offset + 1) % order.length],
      ).find((id) => !removed.has(id));
      const nextTrack = queue.find((track) => track.id === nextId) ?? queue[0];
      return {
        ...setActiveTrack(state, nextTrack),
        queue,
        shuffleOrder: createOrder(queue, nextTrack.id, state.isShuffle),
      };
    }),

  next: () =>
    set((state) => {
      if (!state.active) return {};

      const order = state.isShuffle && state.shuffleOrder.length > 0
        ? state.shuffleOrder
        : state.queue.map((track) => track.id);
      if (order.length === 0) return { pause: true };

      const currentIndex = order.indexOf(state.active.id);
      const nextId = order[currentIndex === -1 ? 0 : (currentIndex + 1) % order.length];
      const nextTrack = state.queue.find((track) => track.id === nextId);
      if (!nextTrack || nextTrack.id === state.active.id) {
        return { currentTime: 0, pause: false, playbackRequest: state.playbackRequest + 1 };
      }

      return setActiveTrack(state, nextTrack);
    }),

  previous: () =>
    set((state) => {
      if (!state.active) return {};

      const order = state.isShuffle && state.shuffleOrder.length > 0
        ? state.shuffleOrder
        : state.queue.map((track) => track.id);
      if (order.length === 0) return { pause: true };

      const currentIndex = order.indexOf(state.active.id);
      const previousId = order[
        currentIndex === -1 ? order.length - 1 : (currentIndex - 1 + order.length) % order.length
      ];
      const previousTrack = state.queue.find((track) => track.id === previousId);
      if (!previousTrack || previousTrack.id === state.active.id) {
        return { currentTime: 0, pause: false, playbackRequest: state.playbackRequest + 1 };
      }

      return setActiveTrack(state, previousTrack);
    }),

  restart: () =>
    set((state) =>
      state.active
        ? { currentTime: 0, pause: false, playbackRequest: state.playbackRequest + 1 }
        : {}
    ),

  toggleShuffle: () =>
    set((state) => {
      const isShuffle = !state.isShuffle;
      return {
        isShuffle,
        shuffleOrder: isShuffle ? createOrder(state.queue, state.active?.id, true) : [],
      };
    }),

  toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),
}));

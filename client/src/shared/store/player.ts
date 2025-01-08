import { create } from "zustand";
import { ITrack } from "@/shared/types/track";
import { PlayerState } from "@/shared/types/player";
import { ICollectionTrack } from "../types/collection";

interface PlayerStore extends PlayerState {
  playTrack: () => void;
  pauseTrack: () => void;
  togglePause: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setDuration: (duration: number) => void;
  setActiveTrack: (track: ITrack) => void;
}

const usePlayerStore = create<PlayerStore>((set) => ({
  currentTime: 0,
  duration: 0,
  active: null,
  volume: 50,
  pause: true,

  playTrack: () => set({ pause: false }),
  pauseTrack: () => set({ pause: true }),
  togglePause: () => set((state) => ({ pause: !state.pause })),
  setCurrentTime: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume }),
  setDuration: (duration) => set({ duration }),
  setActiveTrack: (track) =>
    set({ active: track, duration: 0, currentTime: 0, pause: false }),
}));

export default usePlayerStore;

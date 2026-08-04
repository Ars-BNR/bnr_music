"use client";

import { Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlaybackStore } from "@/entities/playback";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Slider } from "@/shared/ui/slider";

const VOLUME_STEP = 5;

export function VolumeControl() {
  const volume = usePlaybackStore((state) => state.volume);
  const setVolume = usePlaybackStore((state) => state.setVolume);
  const adjustVolume = usePlaybackStore((state) => state.adjustVolume);
  const pointerInsideRef = useRef(false);
  const openedByPointerRef = useRef(false);
  const skipNextTriggerFocusRef = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const closePopover = useCallback(() => {
    clearCloseTimer();
    pointerInsideRef.current = false;
    openedByPointerRef.current = false;
    skipNextTriggerFocusRef.current = true;
    setOpen(false);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    pointerInsideRef.current = false;
    clearCloseTimer();
    closeTimer.current = setTimeout(closePopover, 100);
  }, [clearCloseTimer, closePopover]);

  const keepOpen = useCallback(() => {
    pointerInsideRef.current = true;
    openedByPointerRef.current = true;
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;

    const handleWheel = (event: WheelEvent) => {
      if (!pointerInsideRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      adjustVolume(event.deltaY > 0 ? -VOLUME_STEP : VOLUME_STEP);
    };

    document.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    return () => document.removeEventListener("wheel", handleWheel, true);
  }, [adjustVolume, open]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!pointerInsideRef.current || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      adjustVolume(event.key === "ArrowUp" ? VOLUME_STEP : -VOLUME_STEP);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [adjustVolume]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  return (
    <div onPointerEnter={keepOpen} onPointerLeave={scheduleClose}>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            skipNextTriggerFocusRef.current = false;
            setOpen(true);
          } else {
            closePopover();
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Volume: ${volume}%`}
            onFocus={() => {
              if (skipNextTriggerFocusRef.current) {
                skipNextTriggerFocusRef.current = false;
                return;
              }
              openedByPointerRef.current = false;
              setOpen(true);
            }}
            onBlur={scheduleClose}
          >
            <Volume2 data-icon="inline-start" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          className="w-14 p-3"
          aria-label="Volume control"
          onPointerEnter={keepOpen}
          onPointerLeave={scheduleClose}
          onPointerUp={closePopover}
          onPointerCancel={closePopover}
          onFocus={() => {
            clearCloseTimer();
            setOpen(true);
          }}
          onBlur={scheduleClose}
          onOpenAutoFocus={(event) => {
            if (openedByPointerRef.current) event.preventDefault();
          }}
        >
          <Slider
            aria-label="Volume"
            orientation="vertical"
            variant="player"
            className="h-32"
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onChange={([nextVolume]) => setVolume(nextVolume)}
            onPointerDown={keepOpen}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

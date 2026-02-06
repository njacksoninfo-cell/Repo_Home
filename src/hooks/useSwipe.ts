import { useRef, useState, useCallback, useEffect } from 'react';
import type { SwipeDirection } from '../types/dog';

interface SwipeState {
  offsetX: number;
  offsetY: number;
  rotation: number;
  isDragging: boolean;
  opacity: number;
  direction: SwipeDirection | null;
}

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.12;

export function useSwipe(onSwipe: (direction: SwipeDirection) => void) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const [state, setState] = useState<SwipeState>({
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    isDragging: false,
    opacity: 1,
    direction: null,
  });

  const handleStart = useCallback((clientX: number, clientY: number) => {
    isDragging.current = true;
    startPos.current = { x: clientX, y: clientY };
    setState((s) => ({ ...s, isDragging: true }));
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;

    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    const rotation = dx * ROTATION_FACTOR;
    const absDx = Math.abs(dx);
    const direction: SwipeDirection | null =
      absDx > 30 ? (dx > 0 ? 'right' : 'left') : null;
    const opacity = Math.max(0.3, 1 - absDx / 400);

    setState({
      offsetX: dx,
      offsetY: dy * 0.3,
      rotation,
      isDragging: true,
      opacity,
      direction,
    });
  }, []);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const dx = state.offsetX;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      const direction: SwipeDirection = dx > 0 ? 'right' : 'left';
      const flyX = dx > 0 ? 600 : -600;
      setState({
        offsetX: flyX,
        offsetY: state.offsetY,
        rotation: flyX * ROTATION_FACTOR,
        isDragging: false,
        opacity: 0,
        direction,
      });
      setTimeout(() => onSwipe(direction), 250);
    } else {
      setState({
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        isDragging: false,
        opacity: 1,
        direction: null,
      });
    }
  }, [state.offsetX, state.offsetY, onSwipe]);

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      const flyX = direction === 'right' ? 600 : -600;
      setState({
        offsetX: flyX,
        offsetY: 0,
        rotation: flyX * ROTATION_FACTOR,
        isDragging: false,
        opacity: 0,
        direction,
      });
      setTimeout(() => onSwipe(direction), 250);
    },
    [onSwipe]
  );

  const reset = useCallback(() => {
    setState({
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      isDragging: false,
      opacity: 1,
      direction: null,
    });
  }, []);

  // Touch events
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };
    const onTouchEnd = () => handleEnd();

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  // Mouse events
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => handleEnd();

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleStart, handleMove, handleEnd]);

  return {
    cardRef,
    style: {
      transform: `translate(${state.offsetX}px, ${state.offsetY}px) rotate(${state.rotation}deg)`,
      opacity: state.opacity,
      transition: state.isDragging ? 'none' : 'all 0.3s ease-out',
      cursor: state.isDragging ? 'grabbing' : 'grab',
    },
    direction: state.direction,
    triggerSwipe,
    reset,
  };
}

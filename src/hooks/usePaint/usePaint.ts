import React from 'react';

import { useEvent } from '../useEvent/useEvent';

export interface UsePaintPencil {
  /** Pencil color */
  color?: string;
  /** Pencil width */
  width?: number;
  /** Pencil opacity */
  opacity?: number;
}

export type UsePaintOptions = UsePaintPencil;

/** The use paint return type */
export interface UsePaintReturn {
  pencil: UsePaintPencil & { set: React.Dispatch<React.SetStateAction<UsePaintPencil>> };
  drawing: boolean;
}

export type UsePaintTarget =
  | React.RefObject<HTMLCanvasElement>
  | (() => HTMLCanvasElement)
  | HTMLCanvasElement;

export const getTargetElement = (target: UsePaintTarget) => {
  if (typeof target === 'function') {
    return target();
  }

  if (target instanceof Element) {
    return target;
  }

  return target.current;
};

export type UsePaint = {
  <Target extends UsePaintTarget>(target: Target, options?: UsePaintOptions): UsePaintReturn;

  (
    options?: UsePaintOptions,
    target?: never
  ): UsePaintReturn & { ref: React.RefObject<HTMLCanvasElement> };
};

/**
 * @name usePaint
 * @description - Hook that allows you to draw in a specific area
 *
 * @overload
 * @template Target The target element
 * @param {Target} target The target element to be painted
 * @param {UsePaintOptions} [options] The options to be used
 * @returns {UsePaintReturn} An object containing the current pencil options and functions to interact with the paint
 *
 * @example
 * const { pencil, drawing } = usePaint(canvasRef);
 *
 * @overload
 * @param {UsePaintOptions} [options] The options to be used
 * @returns {UsePaintReturn & { ref: React.RefObject<HTMLCanvasElement> }} An object containing the current pencil options and functions to interact with the paint
 *
 * @example
 * const { ref, pencil, drawing } = usePaint();
 */

export const usePaint = ((...params: any[]) => {
  const target = (
    typeof params[0] === 'object' && !('current' in params[0]) ? undefined : params[0]
  ) as UsePaintTarget | undefined;
  const options = (target ? params[1] : params[0]) as UsePaintOptions | undefined;

  const [drawing, setIsDrawing] = React.useState(false);
  const internalRef = React.useRef<HTMLCanvasElement>(null);
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const [pencil, setPencil] = React.useState({
    width: options?.width ?? 5,
    color: options?.color ?? 'black',
    opacity: options?.opacity ?? 0.1
  });

  const onMouseMove = useEvent((event: MouseEvent) => {
    if (!drawing || !contextRef.current) return;
    contextRef.current.lineTo(event.offsetX, event.offsetY);
    contextRef.current.stroke();
  });

  React.useEffect(() => {
    const element = target ? getTargetElement(target) : internalRef.current;
    if (!element) return;
    contextRef.current = element.getContext('2d');

    const onMouseDown = (event: MouseEvent) => {
      if (!contextRef.current) return;
      contextRef.current.beginPath();
      contextRef.current.moveTo(event.offsetX, event.offsetY);
      setIsDrawing(true);
    };

    const onMouseUp = () => {
      if (!contextRef.current) return;
      contextRef.current.closePath();
      setIsDrawing(false);
    };

    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mouseup', onMouseUp);

    return () => {
      if (!element) return;
      element.removeEventListener('mousedown', onMouseDown);
      element.removeEventListener('mousemove', onMouseMove);
      element.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  React.useEffect(() => {
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = pencil.color;
    contextRef.current.lineWidth = pencil.width;
    contextRef.current.lineCap = 'round';
    contextRef.current.lineJoin = 'round';
  }, [pencil.color, pencil.width, pencil.opacity]);

  if (target) return { pencil: { ...pencil, set: setPencil }, drawing };
  return { pencil: { ...pencil, set: setPencil }, ref: internalRef, drawing };
}) as UsePaint;

import { useMemo, useState } from 'react'

export type ResizeDirection = 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottom' | 'bottomLeft' | 'left' | 'topLeft'
type TPointCoords = { x: number, y: number }
type TOnPointerDown = (event: React.PointerEvent<HTMLElement>) => void
type TCreatePointerDownHandler = (resizeDirection: ResizeDirection) => TOnPointerDown

type HandleProps = {
  onPointerDown?: TOnPointerDown
}

type HandlePropsMap = {
  [key in ResizeDirection]: HandleProps
}

export interface TElementSize {
  width: number
  height: number
}

interface TUseResizerOptions {
  scale?: number
  onResize: (size: { width: number, height: number }) => void
  size: TElementSize
}

/*
  This function prevents text selection which occurs when user drags cursor around the document.
*/
const blockTextSelection = (event: React.PointerEvent<HTMLElement> | PointerEvent): void =>{
  event.stopPropagation()
  event.preventDefault()
}

const allowedResizeDirections: ResizeDirection[] = ['top' , 'topRight' , 'right' , 'bottomRight' , 'bottom' , 'bottomLeft' , 'left' , 'topLeft']

const getEventCoordinates = (
  { clientX, clientY }: PointerEvent
): TPointCoords => ({
  x: clientX,
  y: clientY
})

const sizeReducer = (previousSize: TElementSize, displaysmentVector: TPointCoords, displaysmentDirection: ResizeDirection): TElementSize => {
  switch (displaysmentDirection) {
    case 'top':
      return {
        width: previousSize.width,
        height: previousSize.height - displaysmentVector.y
      }
    case 'topRight':
      return {
        width: previousSize.width + displaysmentVector.x,
        height: previousSize.height - displaysmentVector.y
      }
    case 'right':
      return {
        width: previousSize.width + displaysmentVector.x,
        height: previousSize.height
      }
    case 'bottomRight':
      return {
        width: previousSize.width + displaysmentVector.x,
        height: previousSize.height + displaysmentVector.y
      }
    case 'bottom':
      return {
        width: previousSize.width,
        height: previousSize.height + displaysmentVector.y
      }
    case 'bottomLeft':
      return {
        width: previousSize.width - displaysmentVector.x,
        height: previousSize.height + displaysmentVector.y
      }
    case 'left':
      return {
        width: previousSize.width - displaysmentVector.x,
        height: previousSize.height
      }
    case 'topLeft':
      return {
        width: previousSize.width - displaysmentVector.x,
        height: previousSize.height - displaysmentVector.y
      }
    default:
      return previousSize
  }
}

const createMoveHandler = (
  initialCoords: TPointCoords,
  resizeDirection: ResizeDirection,
  resizerOptions: TUseResizerOptions
): (event: PointerEvent) => void => {
  const { size, onResize, scale = 1 } = resizerOptions

  return (event: PointerEvent) => {
    const currentPointerCoords = getEventCoordinates(event)

    /*
      x represents distance from left to right
      y represents distance from top to bottom
    */
    const displaysmentVector: TPointCoords = {
      x: (currentPointerCoords.x - initialCoords.x) / scale,
      y: (currentPointerCoords.y - initialCoords.y) / scale
    }

    const newSize = sizeReducer(size, displaysmentVector, resizeDirection)

    onResize(newSize)
  }
}

/*
  This small custom memoize is used to prevent recreation of onPointerDown
  event handlers during interaction, when our width and height can change up to 60 times per second.
  If we recreate and attach event handlers on each rerender we lose 50% of our performance.
*/
const memoizedHandler = (() => {
  let memoized: any
  return <T extends (...args: any[]) => any>(arg: T, shouldUseMemoized: boolean): T  => {
    if (!shouldUseMemoized || memoized === undefined) {
      memoized = arg
      return arg
    }

    return memoized
  }
})()

export const useResizer = (useResizerOptions: TUseResizerOptions): HandlePropsMap => {
  const [isResizing, setIsResizing] = useState(false)
  const createPointerDownHandler = useMemo(() => memoizedHandler<TCreatePointerDownHandler>((resizeDirection: any) => (event: any) => {
    blockTextSelection(event)
    setIsResizing(true)

    const initialCoords: TPointCoords = getEventCoordinates(event.nativeEvent)
    /* Use closure that preserves inital coords of interaction */
    const moveHandler = createMoveHandler(initialCoords, resizeDirection, useResizerOptions)

    /* Add event listener to handle pointer motion */
    window.addEventListener('pointermove', moveHandler, false)

    /* Add event listener that will stop interaction once the pointer is up */
    window.addEventListener('pointerup', () => {
      window.removeEventListener('pointermove', moveHandler, false)
      setIsResizing(false)
    }, {
      capture: false,
      once: true /* We only need this to fire once per interaction */
    })
  }, !isResizing), [isResizing, useResizerOptions] )

  const handlePropsMap = useMemo(() => allowedResizeDirections.reduce<HandlePropsMap>((acc, direction) => {
    return {
      ...acc,
      [direction]: {
        onPointerDown: createPointerDownHandler(direction)
      }
    }
  }, {} as HandlePropsMap), [createPointerDownHandler]) 

  return handlePropsMap
}
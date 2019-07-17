import { useCallback, useMemo, useState } from 'react'

export type ResizeDirection = 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottom' | 'bottomLeft' | 'left' | 'topLeft'
type TPointCoords = { x: number, y: number }
type TOnPointerDown = (event: React.PointerEvent<HTMLElement>) => void
type TCreatePointerDownHandler = (resizeDirection: ResizeDirection) => TOnPointerDown

type HandleProps = {
  onPointerDown: TOnPointerDown
}

type HandlePropsMap = {
  [key in ResizeDirection]: HandleProps
}

export interface TElementSize {
  width: number
  height: number
}

interface TUseResizerOptions {
  onResize?: (size: { width: number, height: number }) => void
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
  const { size, onResize } = resizerOptions

  return (event: PointerEvent) => {
   
    const currentPointerCoords = getEventCoordinates(event)

    /*
      x represents distance from left to right
      y represents distance from top to bottom
    */
    const displaysmentVector: TPointCoords = {
      x: currentPointerCoords.x - initialCoords.x,
      y: currentPointerCoords.y - initialCoords.y
    }

    const newSize = sizeReducer(size, displaysmentVector, resizeDirection)
    onResize && onResize(newSize)
  }
}


export const useResizer = (useResizerOptions: TUseResizerOptions): HandlePropsMap => {
  const [memoized, setNewMemoized] = useState(false)
  const createPointerDownHandler = useCallback<TCreatePointerDownHandler>((resizeDirection) => {
    return (event) => {
      blockTextSelection(event)
  
      const initialCoords: TPointCoords = getEventCoordinates(event.nativeEvent)
      /* Use closure that preserves inital coords of interaction */
      const moveHandler = createMoveHandler(initialCoords, resizeDirection, useResizerOptions)
  
      /* Add event listener to handle pointer motion */
      window.addEventListener('pointermove', moveHandler, false)
  
      /* Add event listener that will stop interaction once the pointer is up */
      window.addEventListener('pointerup', () => {
        window.removeEventListener('pointermove', moveHandler, false)
        setNewMemoized(!memoized)
      }, {
        capture: false,
        once: true /* We only need this to fire once per interaction */
      })
    }
    /*
      We change `memoized` state each time interaction ends (pointerup event),
      so that we only create new event handlers when interaction is over.
      
      This is required for performance, because otherwise each time we change width or height
      of the element (which during interaction can happen about 60 time per second) we create new
      onPointerDown event handlers and reattach them to element. These event handlers are useless
      until the intraction is over. Profiler shows about 50% performance boost, so although solution is
      a bit ugly, it stays here until I find something better.
    */
  }, [memoized]) // eslint-disable-line

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
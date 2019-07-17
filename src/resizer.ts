import { useCallback, useMemo, useState, useRef } from 'react'

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

const calculateNewSize = (previousSize: TElementSize, displaysmentVector: TPointCoords, displaysmentDirection: ResizeDirection): TElementSize => {
  switch (displaysmentDirection) {
    case 'bottomRight':
      return {
        width: previousSize.width + displaysmentVector.x,
        height: previousSize.height + displaysmentVector.y
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

    const newSize = calculateNewSize(size, displaysmentVector, resizeDirection)
    console.log(newSize)
    onResize && onResize(newSize)
  }
}


export const useResizer = (useResizerOptions: TUseResizerOptions): HandlePropsMap => {
  const [memoized, setNewMemoized] = useState(false)
  const f = Math.random()
  const createPointerDownHandler = useCallback<TCreatePointerDownHandler>((resizeDirection) => {
    console.log(f)
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
    // only update handlers when resize event stops
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
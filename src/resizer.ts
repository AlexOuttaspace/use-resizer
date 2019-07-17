import { useCallback, useMemo } from 'react'

export type ResizeDirection = 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottom' | 'bottomLeft' | 'left' | 'topLeft'
type TPointCoords = { x: number, y: number }
type TCreatePointerDownHandler = (resizeDirection: ResizeDirection) => TOnPointerDown
type TOnPointerDown = (event: React.PointerEvent<HTMLElement>) => void

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

const createHandlePropsForDirection = (
  direction: ResizeDirection,
  createPointerDown: TCreatePointerDownHandler
) => {
  return {
    onPointerDown: createPointerDown(direction)
  }
}

const getEventCoordinates = (
  { clientX, clientY }: PointerEvent
): TPointCoords => ({
  x: clientX,
  y: clientY
})

const calculateNewSize = (previousSize: TElementSize, displaysmentVector: TPointCoords, displaysmentDirection: ResizeDirection): TElementSize => {
  switch (displaysmentDirection) {
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

    onResize && onResize(newSize)
  }
}

export const useResizer = (options: TUseResizerOptions): HandlePropsMap => {

  const createPointerDownHandler = useCallback<TCreatePointerDownHandler>((resizeDirection) => (event) => {
    blockTextSelection(event)

    const initialCoords: TPointCoords = getEventCoordinates(event.nativeEvent)

    /*
      Use closure that preserves inital coords of interaction
    */
    const moveHandler = createMoveHandler(initialCoords, resizeDirection, options)

    /*
      Add event listener to handle pointer motion
    */
    window.addEventListener('pointermove', moveHandler, false)

    /*
     Add event listener that will stop interaction
     once the pointer is up
    */
    window.addEventListener('pointerup', () => {
      console.log('STOP')
      window.removeEventListener('pointermove', moveHandler, false)
    }, {
      capture: false,
      /* 
        We only need this to fire once per interaction
      */
      once: true
    })
  }, [options])

  const handlePropsMap = useMemo(() => allowedResizeDirections.reduce<HandlePropsMap>((acc, direction) => {
    return {
      ...acc,
      [direction]: createHandlePropsForDirection(direction, createPointerDownHandler)
    }
  }, {} as HandlePropsMap), [createPointerDownHandler])

  return handlePropsMap
}
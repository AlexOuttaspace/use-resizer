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

const blockTextSelection = (e: React.PointerEvent<HTMLElement> | PointerEvent): void =>{
  e.stopPropagation();
  e.preventDefault();
}

const allowedResizeDirections: ResizeDirection[] = ['top' , 'topRight' , 'right' , 'bottomRight' , 'bottom' , 'bottomLeft' , 'left' , 'topLeft']

const createHandlePropsForDirection = (direction: ResizeDirection, createPointerDown: TCreatePointerDownHandler) => {
  return {
    onPointerDown: createPointerDown(direction)
  }
}

const getEventCoordinates = ({ clientX, clientY }: PointerEvent): TPointCoords => ({
  x: clientX,
  y: clientY
})

const createMoveHandler = (initialCoords: TPointCoords, resizeDirection: ResizeDirection, resizerOptions: TUseResizerOptions): any => {
  const { size: { width, height }, onResize } = resizerOptions

  return (event: PointerEvent) => {
   
    const currentPointerCoords = getEventCoordinates(event)

    const displaysments: TPointCoords = {
      x: currentPointerCoords.x - initialCoords.x,
      y: currentPointerCoords.y - initialCoords.y
    }

    onResize && onResize({ width: width + displaysments.x, height: height + displaysments.y })
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

  const handlePropsMap = useMemo<HandlePropsMap>(() => allowedResizeDirections.reduce((acc, direction) => {
    return {
      ...acc,
      [direction]: createHandlePropsForDirection(direction, createPointerDownHandler)
    }
  }, {} as any), [createPointerDownHandler])

  return handlePropsMap
}
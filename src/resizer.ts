import { useState, useCallback, useMemo } from 'react'

type ResizeDirection = 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottom' | 'bottomLeft' | 'left' | 'topLeft'
type TPointCoords = { x: number, y: number }
type TCreatePointerDownHandler = (resizeDirection: ResizeDirection) => TOnPointerDown
type TOnPointerDown = (event: React.PointerEvent<HTMLElement>) => void
const allowedResizeDirections: ResizeDirection[] = ['top' , 'topRight' , 'right' , 'bottomRight' , 'bottom' , 'bottomLeft' , 'left' , 'topLeft']

type HandleProps = {
  onPointerDown: TOnPointerDown
}

type HandlePropsMap = {
  [key in ResizeDirection]: HandleProps
}

const createHandlePropsForDirection = (direction: ResizeDirection, createPointerDown: TCreatePointerDownHandler) => {
  return {
    onPointerDown: createPointerDown(direction)
  }
}

const createMoveHandler = (initialCoords: TPointCoords, resizeDirection: ResizeDirection): any => {
  console.log(initialCoords)
  return (e: any) => console.log(initialCoords, resizeDirection)
}

export const useResizer = (): HandlePropsMap => {

  const createPointerDownHandler = useCallback<TCreatePointerDownHandler>((resizeDirection) => (event) => {
    /*
      Save initial coords of the interaction
    */
    const initialCoords: TPointCoords = { x: event.clientX, y: event.clientY }

    /*
      Use enclosure to preserve inital coords of interaction
    */
    const moveHandler = createMoveHandler(initialCoords, resizeDirection)

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
  }, [])

  const handlePropsMap: HandlePropsMap = allowedResizeDirections.reduce((acc, direction) => {
    return {
      ...acc,
      [direction]: createHandlePropsForDirection(direction, createPointerDownHandler)
    }
  }, {} as any)

  return handlePropsMap
}
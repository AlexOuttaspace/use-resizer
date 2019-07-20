import { useMemo, useState, useRef } from 'react'

export type ResizeDirection =
  | 'top'
  | 'topRight'
  | 'right'
  | 'bottomRight'
  | 'bottom'
  | 'bottomLeft'
  | 'left'
  | 'topLeft'

interface PointCoords {
  x: number
  y: number
}
type OnPointerDown = (event: React.PointerEvent<HTMLElement>) => void
type CreatePointerDownHandler = (
  resizeDirection: ResizeDirection
) => OnPointerDown

interface HandleProps {
  onPointerDown?: OnPointerDown
}

type ResizeHandlePropsMap = {
  [key in ResizeDirection]: HandleProps
}

export interface ElementSize {
  width: number
  height: number
}

interface UseResizerOptions {
  scale?: number
  minWidth?: number
  minHeight?: number
  onResize: (size: ElementSize, resizeDirection: ResizeDirection, event: PointerEvent) => void
  onResizeStart?: (size: ElementSize, resizeDirection: ResizeDirection, event: React.PointerEvent<HTMLElement>) => void
  onResizeStop?: (size: ElementSize, resizeDirection: ResizeDirection, event: PointerEvent) => void
  size: ElementSize
  rotation?: number
  preserveAspectRatio?: boolean
  preserveAspectRatioOnShiftKey?: boolean
}

/*
  This function prevents text selection which occurs
  when user drags cursor around the document.
*/
const blockTextSelection = (
  event: React.PointerEvent<HTMLElement> | PointerEvent
): void => {
  event.stopPropagation()
  event.preventDefault()
}

const allowedResizeDirections: ResizeDirection[] = [
  'top',
  'topRight',
  'right',
  'bottomRight',
  'bottom',
  'bottomLeft',
  'left',
  'topLeft'
]

const cos = (angle: number): number => Math.cos((angle * Math.PI) / 180)
const sin = (angle: number): number => Math.sin((angle * Math.PI) / 180)

const getEventCoordinates = ({
  clientX,
  clientY

}: PointerEvent): PointCoords => ({
  x: clientX,
  y: clientY
})

interface ResizeAction {
  resizeDirection: ResizeDirection

  displaysmentVector: PointCoords
}

const rotateDisplaysmentVector = (
  vector: PointCoords,
  rotation: number
): PointCoords => {
  const cosAngle = cos(rotation)
  const sinAngle = sin(rotation)

  // https://en.wikipedia.org/wiki/Rotation_matrix
  const rotatedVector = {
    x: cosAngle * vector.x + sinAngle * vector.y,
    y: -(sinAngle * vector.x - cosAngle * vector.y) // negative value is because in HTML y axis is from top to bottom
  }

  return rotatedVector
}

const sizeReducer = (
  previousSize: ElementSize,
  { displaysmentVector, resizeDirection }: ResizeAction
): ElementSize => {
  switch (resizeDirection) {
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

const sizeAspectRatioReducer = (
  oldSize: ElementSize,
  newSize: ElementSize,
  resizeDirection: ResizeDirection,
  preserveAspectRatio: boolean
): ElementSize => {
  if (!preserveAspectRatio) return newSize

  switch (resizeDirection) {
    case 'topRight':
    case 'bottomRight':
    case 'bottomLeft':
    case 'topLeft':
    case 'right':
    case 'left': {
      const ratio = newSize.width / oldSize.width

      return {
        width: newSize.width,
        height: oldSize.height * ratio
      }
    }

    case 'top':
    case 'bottom': {
      const ratio = newSize.height / oldSize.height

      return {
        width: oldSize.width * ratio,
        height: newSize.height
      }
    }

    default:
      return newSize
  }
}

/*
  This small custom memoize is used to prevent recreation of onPointerDown
  event handlers during interaction, when our width and height can change up to 60 times per second.
  If we recreate and attach event handlers on each rerender we lose 50% of our performance.
*/
const createHanlerMemoize = (() => {
  let memoized: any
  return <T extends (...args: any[]) => any>(
    arg: T,
    shouldUseMemoized: boolean
  ): T => {
    if (!shouldUseMemoized || memoized === undefined) {
      memoized = arg
      return arg
    }

    return memoized
  }
})

const adjustToMinSize = (
  size: ElementSize,
  minHeight: number,
  minWidth: number
): ElementSize => ({
  width: size.width > minWidth ? size.width : minWidth,
  height: size.height > minHeight ? size.height : minHeight
})

const useRefToValue = <T extends {}>(value: T) => {
  const refToValue = useRef<T>(value)

  refToValue.current = value

  return refToValue
}

interface UseResizerReturnValue  {
  resizeHandlesProps: ResizeHandlePropsMap
  isResizing: boolean
}

export const useResizer = (
  useResizerOptions: UseResizerOptions
): UseResizerReturnValue => {
  const [isResizing, setIsResizing] = useState(false)

  /* 
    When the interaction starts, onPointerDown handler has access only to values
    of props for the moment when interaction is started. This means that if we get
    different props during interaction, our onPointerDown handler would still use old values.
    Using this custom hook allows us to avoid this, as we dont change a value of ref, but instead only
    change .current field, which means that ref object never changes it's value (pointer value I mean),
    but we still have access to all relevant props, and can handle cases when they are change during the interaction
  */
  const refToProps = useRefToValue(useResizerOptions)

  const memoizedHandler = useMemo(() => createHanlerMemoize(), [])

  const createPointerDownHandler = useMemo(() => {
    return memoizedHandler<CreatePointerDownHandler>(
      (resizeDirection) => (event) => {
        blockTextSelection(event)

        /*
          This is a private variable which we use in moveHandler to store previous mouse coordinates
        */
      
        let previousPointerCoords: PointCoords = getEventCoordinates(
          event.nativeEvent
        )
        /* Use closure that preserves inital coords of interaction */
        const moveHandler = (event: PointerEvent) => {
          const currentPointerCoords = getEventCoordinates(event)

          const {
            size,
            scale = 1,
            minHeight = 0,
            minWidth = 0,
            rotation = 0,
            onResize,
            preserveAspectRatio = false,
            preserveAspectRatioOnShiftKey = false
          } = refToProps.current

          const shouldPreserveAspectRatio =
            preserveAspectRatio ||
            (preserveAspectRatioOnShiftKey && event.shiftKey)

          /* 
            x represents distance from left to right
            y represents distance from top to bottom
          */
        
          const displaysmentVector: PointCoords = {
            x: (currentPointerCoords.x - previousPointerCoords.x) / scale,
            y: (currentPointerCoords.y - previousPointerCoords.y) / scale
          }

          const transformedVector = rotateDisplaysmentVector(
            displaysmentVector,
            rotation
          )

          const newSize = sizeReducer(size, {
            displaysmentVector: transformedVector,
            resizeDirection
          })

          const adjustedToMinSize = adjustToMinSize(
            newSize,
            minHeight,
            minWidth
          )

          const adjustedSize = sizeAspectRatioReducer(
            size,
            adjustedToMinSize,
            resizeDirection,
            shouldPreserveAspectRatio
          )

          previousPointerCoords = currentPointerCoords
          onResize(adjustedSize, resizeDirection, event)
        }

        /* Add event listener to handle pointer motion */
        window.addEventListener('pointermove', moveHandler, false)
        const { onResizeStart, size } = refToProps.current
        onResizeStart && onResizeStart(size, resizeDirection, event)
        setIsResizing(true)

        /* Add event listener that will stop interaction once the pointer is up */
        window.addEventListener(
          'pointerup',
          (event: PointerEvent) => {
            window.removeEventListener('pointermove', moveHandler, false)
            const { onResizeStop, size } = refToProps.current
            onResizeStop && onResizeStop(size, resizeDirection, event)
            setIsResizing(false)
          },
          {
            capture: false,
            once: true /* We only need this to fire once per interaction */
          }
        )
      },
      isResizing
    )
  }, [isResizing, memoizedHandler, refToProps])

  const resizeHandlesProps = useMemo(
    () =>
      allowedResizeDirections.reduce<ResizeHandlePropsMap>(
        (acc, direction) => {
          return {
            ...acc,
            [direction]: {
              onPointerDown: createPointerDownHandler(direction)
            }
          }
        },
        {} as ResizeHandlePropsMap
      ),
    [createPointerDownHandler]
  )

  return { resizeHandlesProps, isResizing }
}

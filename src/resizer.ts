import { useMemo, useState, useEffect } from 'react'

export type ResizeDirection =
  | 'top'
  | 'topRight'
  | 'right'
  | 'bottomRight'
  | 'bottom'
  | 'bottomLeft'
  | 'left'
  | 'topLeft'
interface TPointCoords {
  x: number
  y: number
}
type TOnPointerDown = (event: React.PointerEvent<HTMLElement>) => void
type TCreatePointerDownHandler = (
  resizeDirection: ResizeDirection
) => TOnPointerDown

interface HandleProps {
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
  minWidth?: number
  minHeight?: number
  onResize: (
    size: { width: number; height: number },
    resizeDirection: ResizeDirection
  ) => void
  onResizeStart?: (resizeDirection?: ResizeDirection) => void
  onResizeStop?: (resizeDirection?: ResizeDirection) => void
  size: TElementSize
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
}: PointerEvent): TPointCoords => ({
  x: clientX,
  y: clientY
})

interface ResizeAction {
  resizeDirection: ResizeDirection
  displaysmentVector: TPointCoords
}

const rotateDisplaysmentVector = (
  vector: TPointCoords,
  rotation: number
): TPointCoords => {
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
  previousSize: TElementSize,
  { displaysmentVector, resizeDirection }: ResizeAction
): TElementSize => {
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
  oldSize: TElementSize,
  newSize: TElementSize,
  resizeDirection: ResizeDirection,
  preserveAspectRatio: boolean
): TElementSize => {
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
const memoizedHandler = (() => {
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
})()

const adjustToMinSize = (
  size: TElementSize,
  minHeight: number,
  minWidth: number
): TElementSize => ({
  width: size.width > minWidth ? size.width : minWidth,
  height: size.height > minHeight ? size.height : minHeight
})

export const useResizer = (
  useResizerOptions: TUseResizerOptions
): HandlePropsMap => {
  const [isResizing, setIsResizing] = useState(false)
  const { onResizeStop, onResizeStart } = useResizerOptions

  useEffect(() => {
    if (isResizing) {
      onResizeStart && onResizeStart()
      return
    }
    onResizeStop && onResizeStop()
    return
  }, [isResizing, onResizeStart, onResizeStop])

  const createPointerDownHandler = useMemo(() => {
    return memoizedHandler<TCreatePointerDownHandler>(
      (resizeDirection) => (event) => {
        blockTextSelection(event)

        const {
          size,
          onResize,
          scale = 1,
          minHeight = 0,
          minWidth = 0,
          rotation = 0,
          preserveAspectRatio = false,
          preserveAspectRatioOnShiftKey = false
        } = useResizerOptions

        const initialCoords: TPointCoords = getEventCoordinates(
          event.nativeEvent
        )
        /* Use closure that preserves inital coords of interaction */
        const moveHandler = (event: PointerEvent) => {
          const currentPointerCoords = getEventCoordinates(event)

          const shouldPreserveAspectRatio =
            preserveAspectRatio ||
            (preserveAspectRatioOnShiftKey && event.shiftKey)

          /* 
            x represents distance from left to right
            y represents distance from top to bottom
          */
          const displaysmentVector: TPointCoords = {
            x: (currentPointerCoords.x - initialCoords.x) / scale,
            y: (currentPointerCoords.y - initialCoords.y) / scale
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

          onResize(adjustedSize, resizeDirection)
        }

        /* Add event listener to handle pointer motion */
        window.addEventListener('pointermove', moveHandler, false)

        setIsResizing(true)

        /* Add event listener that will stop interaction once the pointer is up */
        window.addEventListener(
          'pointerup',
          () => {
            window.removeEventListener('pointermove', moveHandler, false)

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
  }, [isResizing, useResizerOptions])

  const handlePropsMap = useMemo(
    () =>
      allowedResizeDirections.reduce<HandlePropsMap>(
        (acc, direction) => {
          return {
            ...acc,
            [direction]: {
              onPointerDown: createPointerDownHandler(direction)
            }
          }
        },
        {} as HandlePropsMap
      ),
    [createPointerDownHandler]
  )

  return handlePropsMap
}

import React, { useState, useCallback } from 'react';
import './App.css';
import { useResizer, ResizeDirection } from './resizer'
import { InteractionHandle } from './interaction-handle'

const wrapperStyle: React.CSSProperties = {
  position: 'absolute',
  border: '1px solid green',
  left: 100,
  top: 100
}

const getResizeCursor = (angle: number) => {
  if (337.5 < angle || angle < 22.5) return 'e-resize' // right
  if (22.5 < angle && angle <= 67.5) return 'se-resize' // bottomRight
  if (67.5 < angle && angle <= 112.5) return 's-resize' // bottom
  if (112.5 < angle && angle <= 157.5) return 'sw-resize' // bottomLeft
  if (157.5 < angle && angle <= 202.5) return 'w-resize' // left
  if (202.5 < angle && angle <= 247.5) return 'nw-resize' // topLeft
  if (247.5 < angle && angle <= 292.5) return 'n-resize' // top
  if (292.5 < angle && angle <= 337.5) return 'ne-resize' // topRight
}

const directionCursorBaseAngles = {
  right: 0,
  bottomRight: 45,
  bottom: 90,
  bottomLeft: 135,
  left: 180,
  topLeft: 225,
  top: 270,
  topRight: 315
}

const getHandleStyle = (
  direction: ResizeDirection,
  rotation = 0
): React.CSSProperties => {
  let left: string | number = '50%'
  if (direction.toLowerCase().includes('left')) left = 0
  if (direction.toLowerCase().includes('right')) left = '100%'

  let top: string | number = '50%'
  if (direction.toLowerCase().includes('top')) top = 0
  if (direction.toLowerCase().includes('bottom')) top = '100%'

  return {
    left,
    top,
    cursor: getResizeCursor(
      (directionCursorBaseAngles[direction] + rotation) % 360
    )
  }
}

const rotation = 20

const App: React.FC = () => {
  const [size, setSize] = useState({ width: 100, height: 100})

  const onResize = useCallback(({ width, height}) => setSize({ width, height }), [])

  const resizeHandleProps = useResizer({
    onResize,
    size
  })

  return (
    <React.Fragment>
      <div style={{...wrapperStyle, ...size, transformOrigin: 'top left'}}>
        <InteractionHandle additionalProps={resizeHandleProps.top} scale={1} positionStyles={getHandleStyle('top', rotation)}/>
        <InteractionHandle additionalProps={resizeHandleProps.left} scale={1} positionStyles={getHandleStyle('left', rotation)}/>
        <InteractionHandle additionalProps={resizeHandleProps.right} scale={1} positionStyles={getHandleStyle('right', rotation)}/>
        <InteractionHandle additionalProps={resizeHandleProps.bottom} scale={1} positionStyles={getHandleStyle('bottom', rotation)}/>
        <InteractionHandle additionalProps={resizeHandleProps.topRight} scale={1} positionStyles={getHandleStyle('topRight', rotation)}/>
        <InteractionHandle additionalProps={resizeHandleProps.topLeft} scale={1} positionStyles={getHandleStyle('topLeft', rotation)}/>
        <InteractionHandle additionalProps={resizeHandleProps.bottomLeft} scale={1} positionStyles={getHandleStyle('bottomLeft', rotation)}/>
        <InteractionHandle additionalProps={resizeHandleProps.bottomRight} scale={1} positionStyles={getHandleStyle('bottomRight', rotation)}/>    
      </div>
    </React.Fragment>
  );
}

export default App;

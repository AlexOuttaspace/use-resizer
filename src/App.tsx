import React, { useState } from 'react';
import './App.css';
import { useResizer, ResizeDirection } from './resizer'

const wrapperStyle: React.CSSProperties = {
  position: 'absolute',
  left: 30,
  top: 30
}

const getHandleStyle = (direction: ResizeDirection): React.CSSProperties => {
  const position = (() => {
    let left: string | number = '50%'
    if (direction.toLowerCase().includes('left')) left = 0
    if (direction.toLowerCase().includes('right')) left = '100%'

    let top: string | number = '50%'
    if (direction.toLowerCase().includes('top')) top = 0
    if (direction.toLowerCase().includes('bottom')) top = '100%'
    return { left, top }
  })()

  return {
    ...position,
    transform: "translate(-50%, -50%)",
    position: 'absolute',
    cursor: 'grab',
    width: 10,
    height: 10,
    border: '1px solid blue',
    fontSize: 5
  }
}

const App: React.FC = () => {
  const [size, setSize] = useState({width: 100, height: 100})

  const { top, left, right, bottom, topRight, topLeft, bottomLeft, bottomRight } = useResizer({
    onResize: ({ width, height}) => setSize({ width, height }),
    size
  })

  return (
    <React.Fragment>
      <div style={{...wrapperStyle, ...size}}>
        <div {...top} style={getHandleStyle('top')}>top</div>
        <div {...left} style={getHandleStyle('left')}>left</div>
        <div {...right} style={getHandleStyle('right')}>right</div>
        <div {...bottom} style={getHandleStyle('bottom')}>bottom</div>
        <div {...topRight} style={getHandleStyle('topRight')}>topRight</div>    
        <div {...topLeft} style={getHandleStyle('topLeft')}>topLeft</div>    
        <div {...bottomLeft} style={getHandleStyle('bottomLeft')}>bottomLeft</div>    
        <div {...bottomRight} style={getHandleStyle('bottomRight')}>bottomRight</div>        
      </div>
    </React.Fragment>
  );
}

export default App;

import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useResizer } from './resizer'

const blockStyle = {
  width: 100,
  height: 100,
  border: '1px solid green'
}

const App: React.FC = () => {
  const { top, left, right, bottom, topRight, topLeft, bottomLeft, bottomRight } = useResizer()

  return (
    <React.Fragment>
      <div {...top} style={blockStyle}>top</div>
      <div {...left} style={blockStyle}>left</div>
      <div {...right} style={blockStyle}>right</div>
      <div {...bottom} style={blockStyle}>bottom</div>
      <div {...topRight} style={blockStyle}>topRight</div>    
      <div {...topLeft} style={blockStyle}>topLeft</div>    
      <div {...bottomLeft} style={blockStyle}>bottomLeft</div>    
      <div {...bottomRight} style={blockStyle}>bottomRight</div>        
    </React.Fragment>
  );
}

export default App;

import React from 'react';

export default ({src, width, height}) => (
  <video width={width} height={height} src={src} autoPlay muted loop playsInline />
);

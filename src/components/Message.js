// @flow

import React from 'react';
import Video from './Video';

type MessageProps = {|
  src: string,
  onClick: () => void,
|};

export default ({src, onClick}: MessageProps) => (
  <div>
    <div>
      <Video src={src} width={200} />
    </div>
    <button type="button" onClick={onClick}>
      Toggle Element
    </button>
  </div>
);

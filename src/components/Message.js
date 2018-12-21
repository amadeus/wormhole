// @flow

import React from 'react';
import Video from './Video';
import styles from './Message.module.css';

type MessageProps = {|
  src: string,
  width: number,
  height: number,
  onClick: () => void,
|};

export default ({src, onClick, width, height}: MessageProps) => (
  <div className={styles.container}>
    <Video src={src} width={width} height={height} />
    <button type="button" onClick={onClick} className={styles.button}>
      Toggle Element
    </button>
  </div>
);

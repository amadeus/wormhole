import React from 'react';
import styles from './Video.module.css';

export default ({src, width, height}) => (
  <video className={styles.video} width={width} height={height} src={src} autoPlay muted loop playsInline />
);

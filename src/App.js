// @flow

import React from 'react';
import Wormhole from './Wormhole';
import Content from './components/Content';
import Message from './components/Message';
import {PIP_ID, VIDEO_URL} from './Constants';
import styles from './App.module.css';

function getId(src, context) {
  return `${context}-${src}`;
}

export default () => (
  <Wormhole>
    <Content>
      <Wormhole.Item id={getId(VIDEO_URL, 'content')}>
        {(target, targets, renderItemToTarget) => {
          return (
            <Message
              src={VIDEO_URL}
              onClick={() => {
                const id = getId(VIDEO_URL, 'content');
                if (target === PIP_ID) {
                  renderItemToTarget(id, id);
                } else {
                  renderItemToTarget(id, PIP_ID);
                }
              }}
            />
          );
        }}
      </Wormhole.Item>
    </Content>
    <Wormhole.Target id={PIP_ID} className={styles.pip} />
  </Wormhole>
);

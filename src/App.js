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
      <Wormhole.Item
        id={getId(VIDEO_URL, 'content')}
        renderPlaceholder={(_, __, renderItemToTarget) => (
          <div
            onClick={() => {
              const id = getId(VIDEO_URL, 'content');
              renderItemToTarget(id, id);
            }}
            className={styles.placeholder}
            style={{width: 200, height: 355}}>
            Return video
          </div>
        )}>
        {(target, targets, renderItemToTarget) => {
          return (
            <Message
              width={200}
              height={355}
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

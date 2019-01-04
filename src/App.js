// @flow

import React from 'react';
import Wormhole from './Wormhole';
import Content from './components/Content';
import Message from './components/Message';
import {PIP_ID, VIDEOS_1, VIDEOS_2} from './Constants';
import styles from './App.module.css';

type AppState = {|
  page: number,
  pages: Array<[typeof VIDEOS_1, typeof VIDEOS_2]>,
|};

class App extends React.Component<void, AppState> {
  state = {
    page: 0,
    pages: [VIDEOS_1, VIDEOS_2],
  };

  toggleVideos = () => {
    const {page} = this.state;
    if (page === 0) {
      this.setState({page: 1});
    } else {
      this.setState({page: 0});
    }
  };

  render() {
    const {page, pages} = this.state;
    return (
      <Wormhole>
        <Content>
          {pages[page].map(({src, width, height}) => (
            <Wormhole.Item
              key={src}
              id={src}
              renderPlaceholder={(_, __, renderItemToTarget) => (
                <div
                  onClick={() => {
                    renderItemToTarget(src, src);
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
                    src={src}
                    onClick={() => {
                      if (target === PIP_ID) {
                        renderItemToTarget(src, src);
                      } else {
                        renderItemToTarget(src, PIP_ID);
                      }
                    }}
                  />
                );
              }}
            </Wormhole.Item>
          ))}
          <Wormhole.Item
            id="garretg"
            renderPlaceholder={(_, __, renderItemToTarget) => (
              <div
                onClick={() => {
                  renderItemToTarget('garretg', 'garretg');
                }}
                className={styles.placeholder}
                style={{width: 640, height: 360, marginTop: 20}}>
                Return video
              </div>
            )}>
            {(target, targets, renderItemToTarget) => {
              return (
                <div className={styles.iframeContainer}>
                  <iframe
                    title="garretg"
                    src="https://player.twitch.tv/?channel=garrettg"
                    frameborder="0"
                    allowfullscreen="true"
                    scrolling="no"
                    height="360"
                    width="640"
                  />
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => {
                      if (target === PIP_ID) {
                        renderItemToTarget('garretg', 'garretg');
                      } else {
                        renderItemToTarget('garretg', PIP_ID);
                      }
                    }}>
                    Toggle Element
                  </button>
                </div>
              );
            }}
          </Wormhole.Item>
          <button onClick={this.toggleVideos} type="button" className={styles.button}>
            Videos Page {page + 1}
          </button>
        </Content>
        <Wormhole.Target id={PIP_ID} className={styles.pip} />
      </Wormhole>
    );
  }
}

export default App;

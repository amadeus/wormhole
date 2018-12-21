import React from 'react';
import Content from './components/Content';
import PIP from './components/PIP';
import NodeWrapper from './components/NodeWrapper';
import Video from './components/Video';
import Dispatcher from './Dispatcher';
import connectStores from './lib/connectStores';
import SharedDOMElementStore from './stores/SharedDOMElementStore';
import {ActionTypes, PIP_ID} from './Constants';

function getId(src, context) {
  return `${context}-${src}`;
}

const Message = ({src, context}) => (
  <div>
    <NodeWrapper id={getId(src, context)} ownerId={context} renderPlaceholder={() => <div>Video is elsewhere</div>}>
      {() => <Video src={src} width={200} />}
    </NodeWrapper>
    <button
      type="button"
      onClick={() => {
        Dispatcher.dispatch({
          type: ActionTypes.SHARED_NODE_TRANSFER_OWNERSHIP,
          id: getId(src, context),
          ownerId: PIP_ID,
        });
      }}>
      Move to pip
    </button>
  </div>
);

const ConnectedPIP = connectStores(
  [SharedDOMElementStore],
  () => ({
    node: SharedDOMElementStore.getOwnedNode(PIP_ID),
  }),
  PIP
);

export default () => (
  <>
    <Content>
      <Message
        src="https://cdn.discordapp.com/attachments/267040578556919808/522213885948985380/video.mov"
        context="messages"
      />
    </Content>
    <ConnectedPIP />
  </>
);

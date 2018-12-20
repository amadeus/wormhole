import React, {Component} from 'react';
import Dispatcher from './Dispatcher';
import {ActionTypes} from './Constants';
import CounterStore from './CounterStore';
import Counter from './Counter';
import connectStores from './lib/connectStore';

const ConnectedCounter = connectStores([CounterStore], () => ({count: CounterStore.count}), Counter);

class App extends Component {
  componentDidMount() {
    setInterval(() => Dispatcher.dispatch({type: ActionTypes.INCREMENT_COUNTER}), 1000);
  }

  render() {
    return (
      <div style={{padding: 20, textAlign: 'center'}}>
        <ConnectedCounter />
      </div>
    );
  }
}

export default App;

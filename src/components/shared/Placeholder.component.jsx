import React from 'react';
import { Placeholder } from '@link-loom/react-sdk';

const PlaceholderComponent = () => {
  return (
    <Placeholder type="table" count={4}>
      <Placeholder type="title" count={1}>
        <Placeholder type="description" count={1} />
      </Placeholder>
    </Placeholder>
  );
};

export default PlaceholderComponent;

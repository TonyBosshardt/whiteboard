import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

import './ResizableInput.scss';

const MIN_WIDTH_PX = 50;
const MAX_WIDTH_PX = 300;
const ResizableInput = ({ value }) => {
  const inputRef = useRef();
  const [_localValue, setLocalvalue] = useState(value);
  useEffect(() => {
    if (inputRef?.current) {
      const { current } = inputRef;
      current.style.width = `${Math.min(MAX_WIDTH_PX, current.scrollWidth)}px`;
      // current.style.width = `${_localValue.length}ch`;
    }
  }, [inputRef]);

  const handleChangeAndSize = ({ target }) => {
    if (!inputRef?.current) {
      return;
    }
    const { current } = inputRef;

    console.log(target.scrollWidth, current.style.width);

    // console.log(target., current.scrollWidth, Math.max(MIN_WIDTH_PX, target.scrollWidth));
    current.style.width = `${Math.max(MIN_WIDTH_PX, target.scrollWidth)}px`;
    // current.style.width = `calc(${target.value.length}ch + 1em)`;
    setLocalvalue(target.value);
  };

  return (
    <input
      className={classNames('resizable-input')}
      onChange={handleChangeAndSize}
      ref={inputRef}
      style={{ minWidth: MIN_WIDTH_PX, maxWidth: MAX_WIDTH_PX }}
      value={_localValue}
    />
  );
};

export default ResizableInput;
// import React, { useEffect, useRef, useState } from 'react';

// const ResizableInput = () => {
//   const [content, setContent] = useState('');
//   const [width, setWidth] = useState(0);
//   const span = useRef();

//   useEffect(() => {
//     setWidth(span.current.offsetWidth);
//   }, [content]);

//   const changeHandler = (evt) => {
//     setContent(evt.target.value);
//   };

//   return (
//     <wrapper>
//       <span id="hide" ref={span}>
//         {content}
//       </span>
//       <input type="text" style={{ width }} onChange={changeHandler} />
//     </wrapper>
//   );
// };

// export default ResizableInput;

import React, { useRef, useEffect } from 'react';
import { components } from 'react-select';
//CustomMenuList component for react-select infinite scroll handling and loading options before reaching 100% scroll
//Scroll to start lazy loading options at 70% scroll position
const CustomMenuList = (props) => {
  const menuListRef = useRef();

  useEffect(() => {
    const node = menuListRef.current;
    if (!node) return;

    const handleScroll = (event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.target;
      const scrollRatio = scrollTop / (scrollHeight - clientHeight);

      if (scrollRatio > 0.7 &&
          props.selectProps.hasMore &&
          !props.selectProps.loadingMore &&
          typeof props.selectProps.loadMoreOptions === 'function') {
        const { hasMore, page, loadMoreOptions } = props.selectProps;

        if (hasMore && typeof loadMoreOptions === 'function') {
          const nextPage = page + 1;
          console.log("Triggering loadMoreOptions from MenuList (page:", nextPage, ")");
          loadMoreOptions(nextPage);
        }
      }
    };

    node.addEventListener('scroll', handleScroll);
    return () => {
      node.removeEventListener('scroll', handleScroll);
    };
  }, [props.selectProps]);

  return (
    <components.MenuList {...props} innerRef={menuListRef}>
      {props.children}
    </components.MenuList>
  );
};

export default CustomMenuList;
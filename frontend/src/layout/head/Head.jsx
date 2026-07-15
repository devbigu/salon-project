import React from "react";

const Head = ({ ...props }) => {
  return (
      <Title>{`${props.title ? props.title + " | " : ""}MiriSoft`}</Title>
  );
};
export default Head;


import { useEffect } from 'react';

function Title({ children }) {
  useEffect(() => {
    const prev = document.title;
    document.title = children;

    return () => {
      document.title = prev;
    };
  }, [children]);

  return null;
}

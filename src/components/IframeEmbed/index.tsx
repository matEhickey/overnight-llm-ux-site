import React from 'react';

interface IframeEmbedProps {
  src: string;
  height?: string;
  title?: string;
}

export default function IframeEmbed({src, height = '400px', title = 'Game Demo'}: IframeEmbedProps) {
  return (
    <iframe
      src={src}
      style={{
        width: '100%',
        height,
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: '8px',
      }}
      title={title}
      allow="fullscreen"
    />
  );
}

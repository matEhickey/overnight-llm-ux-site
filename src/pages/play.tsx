import Layout from '@theme/Layout';
import React from 'react';

export default function Play(): JSX.Element {
  return (
    <Layout title="Play" description="Play the latest build">
      <main style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
        <iframe
          src="/game/latest/index.html"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Overnight Game"
        />
      </main>
    </Layout>
  );
}

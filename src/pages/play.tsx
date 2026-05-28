import Layout from '@theme/Layout';
import React from 'react';

export default function Play(): JSX.Element {
  return (
    <Layout title="Play" description="Play the current main branch build">
      <main style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
        <iframe
          src="/game/main/index.html"
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

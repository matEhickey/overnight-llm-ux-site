import React from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function Demo(): React.ReactElement {
  return (
    <Layout title="Latest Demo" description="Latest LLM UX demo">
      <main style={{padding: '1rem', height: 'calc(100vh - 60px)'}}>
        <BrowserOnly>
          {() => (
            <iframe
              src="/ux/latest/index.html"
              style={{width: '100%', height: '100%', border: 'none'}}
              title="Latest UX Demo"
              allow="fullscreen"
            />
          )}
        </BrowserOnly>
      </main>
    </Layout>
  );
}

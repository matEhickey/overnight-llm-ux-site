import React from 'react';
import Layout from '@theme/Layout';

export default function Home(): React.ReactElement {
  return (
    <Layout description="In-browser LLM UX explorations">
      <main style={{maxWidth: 800, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center'}}>
        <h1>Overnight LLM UX</h1>
        <p style={{fontSize: '1.1rem', color: '#555', lineHeight: 1.6}}>
          Research, implementation, and working demos of in-browser LLM UX.
          Built one feature at a time, every night.
        </p>
        <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginTop: '2rem'}}>
          <a href="/docs/ux" className="button button--primary button--lg">Browse Docs</a>
          <a href="/blog" className="button button--secondary button--lg">Read Blog</a>
          <a href="/demo" className="button button--secondary button--lg">Try Latest</a>
        </div>
      </main>
    </Layout>
  );
}

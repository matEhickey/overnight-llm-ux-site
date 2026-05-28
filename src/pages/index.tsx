import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/blog">
            Latest Build →
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="3D exploration prototype — built one feature at a time">
      <HomepageHeader />
      <main>
        <div className="container" style={{padding: '2rem 0', textAlign: 'center'}}>
          <div style={{display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <div style={{maxWidth: 300}}>
              <h3>📖 Docs</h3>
              <p>Read about each build — design decisions, implementation notes, and live demos.</p>
              <Link to="/docs/game">Browse Docs →</Link>
            </div>
            <div style={{maxWidth: 300}}>
              <h3>📝 Blog</h3>
              <p>Short announcements for every new feature, straight from the overnight cycle.</p>
              <Link to="/blog">Read Blog →</Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

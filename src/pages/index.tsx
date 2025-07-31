import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/getting-started">
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="https://github.com/vantige-ai/typescript-sdk">
            View on GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function QuickStart() {
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <h2 className={styles.quickStartTitle}>Quick Start</h2>
        <div className={styles.codeExample}>
          <pre className="language-typescript"><code className="language-typescript">{`import { VantigeClient } from '@vantige-ai/typescript-sdk';

const client = new VantigeClient({
  apiKey: process.env.VANTIGE_API_KEY
});

const response = await client.query({
  corpusId: 'docs',
  query: 'How do I get started?',
  generateAnswer: true
});

console.log(response.answer);`}</code></pre>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Official TypeScript SDK for Vantige AI's knowledge base querying API">
      <HomepageHeader />
      <main>
        <QuickStart />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}

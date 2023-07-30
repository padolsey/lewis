import styles from '@/styles/Page.module.scss';

export default function Page({ children, className }) {
  return (
    <div className={styles.page}>
      <header>
        <h1>
          <a href="/">
            <span>TL;DP:</span> too long; didn't parliament
          </a>
        </h1>

        <p>
          LLM-Condensed overviews of parliamentary bills. Experimental. <a href="https://medium.com/@padolsey/using-llms-to-parse-and-understand-proposed-legislation-9eec469d9830">Read implementation notes here</a>. Made by <a href="https://j11y.io">James</a>.
        </p>
      </header>
      <main className={className}>{children}</main>
    </div>
  );
}

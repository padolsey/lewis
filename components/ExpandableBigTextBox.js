import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/ExpandableBigTextBox.module.scss';

export default function ExpandableBigTextBox({ className, html, headline }) {

  if (!html?.trim()) return null;

  const [isExpandable, setIsExpandable] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (contentRef.current.getBoundingClientRect().height > 300) {
        setIsExpandable(true);
      }
    }
  }, [html]);

  return <div
    className={[
      className || '',
      styles.expandableBigTextBox,
      isExpandable ? styles.expandable : '',
      isExpanded ? styles.expanded : ''
    ].join(' ')}
    onClick={e => isExpandable && !isExpanded && setIsExpanded(true)}
  >

    <section>
      <h2>{headline}:</h2>{' '}
      <div ref={contentRef} dangerouslySetInnerHTML={{__html: html || ''}}></div>
    
      {
        isExpandable && !isExpanded &&
        <button onClick={e => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}>
          Click to read all [+]
        </button>
      }
    </section>
  </div>
}

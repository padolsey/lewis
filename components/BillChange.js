import { useState, useEffect } from 'react';

import styles from '@/styles/BillChange.module.scss';

const FLAGS = {
  RED: {
    title: '🔴 Flagged for scrutiny',
    desc: 'Obviously negative effect on progressive ideals',
    // color: '#AC3D39'
    color: '#fee0e0'
  },
  YELLOW: {
    title: '🟠 Flagged for scrutiny',
    desc: 'Questionably negative effect on progressive ideals',
    // color: '#C36F4B',
    color: '#feebdf'
  },
  WHITE: {
    title: '⚫ Notable',
    desc: 'Least Concern',
    color: '#ededed'
  },
  BLUE: {
    title: '🟢 Flagged for scrutiny',
    desc: 'Possible positive effect on progressive ideals',
    // color: '#6EBACF'
    color: '#e0edfe'
  },
  GREEN: {
    title: '🟢🟢 Flagged as ?positive?',
    desc: 'Obviously positive effect on progressive ideals',
    color: '#d9f4d2'
  },
};

const IMPACTS = {
  1: {
    title: '🔵 Minor'
  },
  2: {
    title: '🔵🔵 Moderate'
  },
  3: {
    title: '🔵🔵🔵 High'
  },
  4: {
    title: '🟣🟣🟣🟣 Reshaping'
  },
  5: {
    title: '🟣🟣🟣🟣🟣 Overhaul'
  },

  // Newer Impact types from function-calling BillDelta version
  'SEMANTIC': {
    title: '🔵 Semantic'
  },
  'MINOR': {
    title: '🔵🔵 Minor'
  },
  'MODERATE': {
    title: '🔵🔵🔵 Moderate'
  },
  'HIGH': {
    title: '🟣🟣🟣🟣 High'
  },
  'RESHAPING': {
    title: '🟣🟣🟣🟣🟣 Reshaping'
  }
};

const CLARITIES = {
  1: {
    title: '❓Vague'
  },
  2: {
    title: '🆗 Average'
  },
  3: {
    title: '✅ Clear'
  }
};

function renderQuoteAtIndex(quote, index, rawBill) {

  if (index === -1) return null;

  return <>
    ...
    {
      rawBill.slice(
        Math.max(0, index - 200),
        index
      )
    }
    ...
    <strong className={styles.quote}>{quote}</strong>
    ...
    {
      rawBill.slice(index + quote.length, index + quote.length + 200)
    }
    ...
  </>;
}

function MicroViewBillChange(change) {
  const flag = FLAGS[change.flag] || null;
  const impact = IMPACTS[change.impact] || null;
  const clarity = CLARITIES[change.clarity] || null;
  return <li className={styles.microChange}>
    <section>
      {/*<ul className={styles.metrics}>
        <li className={styles.flag}>
          <span>{ flag?.title || '' }</span>
        </li>
        <li className={styles.impact}>
          <span>Impact: { impact?.title || 'Unknown' }</span>
        </li>
        <li className={styles.clarity}>
          <span>Clarity: {clarity?.title}</span>
        </li>
        <li className={styles.type}>
          <span>Type: {change.type}</span>
        </li>
      </ul>*/}

      <h3>{change.subject}</h3>
      <p>{change.summary}</p>
    </section>
  </li>;
}

export default function BillChange({rawBill, ...change}) {

  const [isExpanded, setIsExpanded] = useState(false);

  const flag = FLAGS[change.flag] || null;
  const impact = IMPACTS[change.impact] || null;
  const clarity = CLARITIES[change.clarity] || null;

  if (!change.quotes?.length) return null;

  // if (!isExpanded) {
  //   return <MicroViewBillChange {...change} />
  // }

  return <li className={[
    styles.change,
    isExpanded ? styles.expanded : ''
  ].join(' ')} style={{
    // outlineColor: flag.color,
    backgroundColor: flag?.color
  }}>
    <section style={{
      // backgroundColor: flag.color
    }}>
      <ul className={styles.metrics}>
        <li className={styles.flag}>
          <span>{ flag?.title || '' }</span>
        </li>
        <li className={styles.impact}>
          <span>Impact: { impact?.title || 'Unknown' }</span>
        </li>
        <li className={styles.type}>
          <span>Type: {change.type}</span>
        </li>
      </ul>

      <div className={styles.content}>

        <strong>{change.changeIndex}</strong>

        <h3>{change.subject}</h3>
        <p>{change.summary}</p>


        {/*<h3>Quotes</h3>

        {
          change.quotes?.length &&
          <ul>
            {
              change.quotes.map(q => {
                return <li key={q}><blockquote>{q}</blockquote></li>;
              })
            }
          </ul>
        }*/}

        {
          change.locatedQuote?.index > -1
          &&
          <blockquote className={styles.relevantBillText}>
            <strong>Exemplar quote from bill</strong>: {
              renderQuoteAtIndex(
                change.locatedQuote.quote,
                change.locatedQuote.index,
                rawBill
              )
            }
          </blockquote>
        }

        {change?.pillars?.length ? <div className={styles.pillars}>

          <ul>
            {change?.pillars?.length && change.pillars.map((pillar) => {
              
              return <li
                key={pillar.name}
                title={pillar.analysis?.trim() || ''}>
                {
                  <>
                    <strong>‼️ {pillar.name}</strong>
                    <p>{pillar.analysis?.trim() || <em style={{opacity: 0.5}}>(Possibly affected)</em>}</p>
                  </>
                }
              </li>
            })}
          </ul>

        </div> : null}


      </div>

    </section>

  </li>
}
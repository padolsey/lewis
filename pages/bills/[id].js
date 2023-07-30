import { useState, useEffect } from 'react';
import Head from 'next/head';

import { getBill, getBillList } from '@/utils/bills';
import Page from '@/components/Page';
import Change from '@/components/BillChange';
import ExpandableBigTextBox from '@/components/ExpandableBigTextBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLink } from '@fortawesome/free-solid-svg-icons'

import styles from '@/styles/Bill.module.scss';

function weightDescendingComparator(a, b) {

  // console.warn(a, b);

  let ai = Number(a.impact || 1);
  let bi = Number(b.impact || 1);

  if (isNaN(ai)) ai = 1;
  if (isNaN(bi)) bi = 1;

  const aFlagIndex = ['WHITE', 'BLUE', 'GREEN', 'YELLOW', 'RED'].indexOf(a.flag) + 1;
  const bFlagIndex = ['WHITE', 'BLUE', 'GREEN', 'YELLOW', 'RED'].indexOf(b.flag) + 1;

  ai += aFlagIndex * 3;
  bi += bFlagIndex * 3;

  return ai > bi ? -1 : ai == bi ? 0 : 1;

}

function Sponsor(sponsor, i) {
  return <div className={styles.sponsor} key={i}>
    {
      !!sponsor.member?.name &&
      <span
        className={styles.sponsorMember}
        key={sponsor.member.name}
        style={{
          borderBottomColor: '#' + sponsor.member.partyColour}}>
          {sponsor.member.name}
      </span>
    }
    {' '}
    <span>({
      sponsor.organisation?.name.trim()
    })</span>
  </div>;
}

export default function Bill({ bill }) {

  // console.log('>>>>>bill', bill);

  const rawSearchable = bill.rawSearchable;
  const rawBill = bill.raw;

  // bill.apiData = API_DATA_TEST;

  if (!bill.apiData) {
    return <>Cannot find</>;
  }

  return (
    <Page className={styles.main}>

      <Head>
        <title>{`TL;DP: ${bill.apiData.shortTitle}`}</title>
      </Head>

      <div>
      <section>
        <h1>
          <a
            href={`https://bills.parliament.uk/bills/${bill.apiData.billId}`}
            title="go to bill on parliament website (opens in new tab)"
            target="_blank"
          >
            {bill.apiData.shortTitle}
            {' '}
            <FontAwesomeIcon icon={faExternalLink} />
          </a>
        </h1>

        {/*{
          bill?.apiData ?
            <pre>{JSON.stringify(bill.apiData)}</pre>
            : null
        }
  */}
        <div className={styles.billMeta}>
          <p className={styles.billLongTitle}>
            {bill.apiData.longTitle}
          </p>

          <ul className={styles.billData}>
            <li>Originating House: {bill.apiData.originatingHouse}</li>
            <li>Current House: {bill.apiData.currentHouse}</li>
            {
              bill.apiData.currentStage?.description ?
                <li>Current Stage: {bill.apiData.currentStage?.description} {/Royal/.test(bill.apiData.currentStage?.description) ? <strong style={{backgroundColor:'yellow'}}>(This is now an Act of Parliament (I.e. an active law)</strong> : ''}</li>
                : null
            }
            <li className={styles.sponsors}>Sponsors: {
              bill.apiData.sponsors
                .map((k, i) => {
                  return <span key={i}>
                    {Sponsor(k, i)}
                    {i < bill.apiData.sponsors.length - 1 ? ', ' : ''}
                  </span>;
                })
            }</li>
            <li>Link:{' '}
              <a href={`https://bills.parliament.uk/bills/${bill.apiData.billId}`}>
                {
                  `https://bills.parliament.uk/bills/${bill.apiData.billId}`
                }
              </a>
            </li>
          </ul>

          <p><small>The analysis below is based on the latest amended version of the bill found on <strong>{bill.dateOfAnalysis}</strong>. You can find the exact <a href={bill.href}>PDF document here</a>: <code>{bill.href}</code></small></p>
        </div>

      </section>
      </div>

      <ExpandableBigTextBox
        className={styles.tldr}
        headline="TL;DR"
        html={bill.tldr}
      />

      <ExpandableBigTextBox
        className={styles.concerns}
        headline="Concerns"
        html={bill.concerns}
      />

      <ExpandableBigTextBox
        className={styles.claude}
        headline="Detailed Overview"
        html={bill.claude}
      />

      <div className={styles.changesIntro}>
        <section>
          {/*<h2>Read before continuing!</h2>*/}

          <p>

            Below we have highlighted changes found in the most recent amended version of the bill that was found on the analysis-date of <strong style={{backgroundColor: "white", color: "Black"}}>{bill.dateOfAnalysis}</strong>, so it may not reflect latest changes. Those highest up have been flagged as impactful or worthy of public scutiny or attention. These are the likely to be the <i>highest signal</i> parts of the bill; members of the public might benefit from seeing these.
            
          </p>

          <p>

            <strong>Important:</strong> <em>This document is not guaranteed to reflect the content of the bill, and may be entirely inaccurate in its summaries. This is an experimental analysis. </em>
          </p>

          <p>
            You are <u>urged</u> to read the bill itself on the official parliament bills website: {' '}
              <a href={`https://bills.parliament.uk/bills/${bill.apiData.billId}`}>
                {
                  `https://bills.parliament.uk/bills/${bill.apiData.billId}`
                }
              </a>
          </p>
        </section>
      </div>

      <ul className={styles.changes}>
        {
          bill.changes
            .sort(weightDescendingComparator)
            .map((change, index) => 
              <Change {...change} rawBill={rawBill} key={index} />
            )
        }
      </ul>

      <div className={styles.changesOutro}>
        <section>
          <h2>That's everything!</h2>

          <p>

            <strong>Remember:</strong> <em>This document is not guaranteed to reflect the content of the bill, and may be entirely inaccurate in its summaries. This is an experimental analysis.</em> Read the bill itself on the official parliament bills website: {' '}
              <a href={`https://bills.parliament.uk/bills/${bill.apiData.billId}`}>
                {
                  `https://bills.parliament.uk/bills/${bill.apiData.billId}`
                }
              </a>
          </p>
        </section>
      </div>
    </Page>
  );
}

export async function getStaticPaths() {

  const bills = await getBillList();

  // Get the paths we want to pre-render based on bills
  const paths = bills.map((bill) => ({
    params: { id: bill.id },
  }));

  return { paths, fallback: false };

}

export async function getStaticProps({ params }) {
  const bill = await getBill(params.id);
  return {
    props: {
      bill,
    },
  };
}

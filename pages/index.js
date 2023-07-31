import { getBillList } from '@/utils/bills';
import Link from 'next/link';
import Head from 'next/head';
import styles from '@/styles/Home.module.scss';
import Page from '@/components/Page';

export default function Home({ bills }) {
    return (
      <Page className={styles.main}>

        <Head>
          <title>Parse The Bill</title>
        </Head>
        
        <section>

          <p><strong><a href="/" title="Parse The Bill">ParseTheBill.com</a></strong> makes proposed legislation in the UK more accessible and understandable for engaged citizens and advocacy groups who want to stay informed but don't have time to read full legal texts. Readers should always verify details from the raw bill documents found on the <a href="https://bills.parliament.uk/">parliamentary bills website</a>.</p>

          <h2>Available Bills:</h2>

          <ul>
              {bills.map((doc, index) => {
                return (
                  <li key={index}>
                      <Link href={`/bills/${doc.id}`}>
                          {doc.title}
                      </Link>
                      <div dangerouslySetInnerHTML={{__html: doc.tldr || '<span/>'}}></div>
                  </li>
                );
              })}
          </ul>
        </section>
      </Page>
    );
}

export async function getStaticProps() {
    const bills = await getBillList();

    return {
        props: {
            bills,
        },
    };
}
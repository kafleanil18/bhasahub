import HskFaq from '../hsk/HskFaq';

// Its own page, linked from the header and footer. The same questions and answers as
// "Learning Chinese with Xiao Ao" on About HSK.
export default function FaqPage() {
  return <main className="home-page faq-page" aria-labelledby="faq-title">
    <section className="home-faq">
      <div className="container">
        <div className="section-header-center">
          <p className="home-section-kicker">Questions</p>
          <h1 className="section-title" id="faq-title">FAQ</h1>
        </div>
        <HskFaq />
      </div>
    </section>
  </main>;
}

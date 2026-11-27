import HskFaq from '../hsk/HskFaq';

// The same questions and answers as "Learning Chinese with Xiao Ao" on About HSK, below the reviews.
export default function HomeFaq() {
  return <section className="home-faq" aria-labelledby="home-faq-title">
    <div className="container">
      <div className="section-header-center">
        <p className="home-section-kicker">Questions</p>
        <h2 className="section-title" id="home-faq-title">FAQ</h2>
      </div>
      <HskFaq />
    </div>
  </section>;
}

// Bundled reference papers share the same authenticated portal and grading flow.
const papers = [require('./hsk11226'), require('./hsk10901'), require('./hsk11556'), require('./hsk11221'), require('./hsk11112'), require('./hsk11009'), require('./hsk11332'), require('./hsk11440'), require('./hsk11552')];
module.exports = Object.fromEntries(papers.map(paper => [paper.id, paper]));

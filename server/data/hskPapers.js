// Bundled reference papers share the same authenticated portal and grading flow.
const papers = [require('./hsk11226'), require('./hsk10901'), require('./hsk11556')];
module.exports = Object.fromEntries(papers.map(paper => [paper.id, paper]));

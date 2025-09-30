import { expect } from 'chai';
import ProfesiaAdapter from '../adapters/profesiaAdapter.js';

describe('Profesia Adapter', () => {
  it('should parse HTML using the parse method', () => {
    const adapter = new ProfesiaAdapter();
    const html = '<html><h1 itemprop="title">Test Job</h1></html>';
    const jobId = 'id1';
    const jobUrl = 'https://www.profesia.sk/praca/id1';
    const result = adapter.parse(html, jobId, jobUrl);
    expect(result).to.have.property('jobTitle', 'Test Job');
    expect(result).to.have.property('jobId', jobId);
    expect(result).to.have.property('jobUrl', jobUrl);
  });

  it('should return nulls for missing fields', () => {
    const adapter = new ProfesiaAdapter();
    const html = '<html></html>';
    const result = adapter.parse(html, 'id2', 'url2');
    expect(result.companyName).to.be.null;
    expect(result.location).to.be.null;
    expect(result.salaryMin).to.be.null;
    expect(result.tags).to.be.an('array').that.is.empty;
  });

  it('should extract tags from HTML', () => {
    const adapter = new ProfesiaAdapter();
    const html = `
      <html>
        <span class="hidden-xs"><a href="/praca/tagX">TagX</a></span>
        <span class="hidden-xs"><a href="/praca/tagY">TagY</a></span>
      </html>
    `;
    const result = adapter.parse(html, 'id3', 'url3');
    expect(result.tags).to.include.members(['TagX', 'TagY']);
  });

  it('should parse salary fields correctly', () => {
    const adapter = new ProfesiaAdapter();
    const html = `<div class="salary-range">2 000 – 3 000 EUR/mesiac</div>`;
    const result = adapter.parse(html, 'id4', 'url4');
    expect(result.salaryMin).to.equal(2000);
    expect(result.salaryMax).to.equal(3000);
    expect(result.salaryCurrency).to.equal('EUR');
    expect(result.salaryPeriod).to.equal('mesiac');
  });

  it('should parse employmentType if present', () => {
    const adapter = new ProfesiaAdapter();
    const html = `<span itemprop="employmentType">živnosť</span>`;
    const result = adapter.parse(html, 'id5', 'url5');
    expect(result.employmentType).to.equal('živnosť');
  });

  it('should handle multiple tags and missing optional fields', () => {
    const adapter = new ProfesiaAdapter();
    const html = `
      <html>
        <span class="hidden-xs"><a href="/praca/tagA">TagA</a></span>
        <span class="hidden-xs"><a href="/praca/tagB">TagB</a></span>
        <span class="hidden-xs"><a href="/praca/tagC">TagC</a></span>
      </html>
    `;
    const result = adapter.parse(html, 'id6', 'url6');
    expect(result.tags).to.include.members(['TagA', 'TagB', 'TagC']);
    expect(result.companyName).to.be.null;
    expect(result.location).to.be.null;
  });

  it('should parse postedAt date in correct format', () => {
    const adapter = new ProfesiaAdapter();
    const html = `
      <html>
        <div class="padding-on-bottom">
          <strong>Dátum zverejnenia</strong>
          <span>1.7.2025</span>
        </div>
      </html>
    `;
    const result = adapter.parse(html, 'id7', 'url7');
    expect(result.postedAt).to.equal('2025-07-01');
  });
});
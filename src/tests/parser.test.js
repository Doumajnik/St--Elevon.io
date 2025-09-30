import { expect } from 'chai';
import parseProfesia from '../utils/parsers/profesiaParser.js';

describe('Profesia Parser', () => {
  it('should parse job HTML and extract required fields', () => {
    const html = `
      <html>
        <h1 itemprop="title">Test Job Title</h1>
        <h2 itemprop="hiringOrganization"><span>Test Company</span></h2>
        <span class="hidden-xs"><a href="/firma/test-company">Test Company</a></span>
        <strong>Miesto práce</strong><br><span>Bratislava</span>
        <div class="salary-range">1 000 – 2 000 EUR/mesiac</div>
        <span itemprop="employmentType">plný úväzok</span>
        <span class="hidden-xs"><a href="/praca/tag1">Tag1</a></span>
        <span class="hidden-xs"><a href="/praca/tag2">Tag2</a></span>
        <div class="details-desc">Test description</div>
      </html>
    `;
    const jobId = 'test123';
    const jobUrl = 'https://www.profesia.sk/praca/test123';
    const result = parseProfesia(html, jobId, jobUrl);

    expect(result).to.have.property('jobId', jobId);
    expect(result).to.have.property('jobTitle').that.is.a('string');
    expect(result).to.have.property('location').that.is.a('string');
    expect(result).to.have.property('jobUrl', jobUrl);
    expect(result).to.have.property('companyName');
    expect(result).to.have.property('description');
  });

  it('should parse salary fields correctly', () => {
    const html = `
      <html>
        <div class="salary-range">1 500 – 2 500 EUR/mesiac</div>
      </html>
    `;
    const result = parseProfesia(html, 'id', 'url');
    expect(result.salaryMin).to.equal(1500);
    expect(result.salaryMax).to.equal(2500);
    expect(result.salaryCurrency).to.equal('EUR');
    expect(result.salaryPeriod).to.equal('mesiac');
  });

  it('should handle missing optional fields gracefully', () => {
    const html = `<html><h1 itemprop="title">No Company</h1></html>`;
    const result = parseProfesia(html, 'id', 'url');
    expect(result.companyName).to.be.null;
    expect(result.location).to.be.null;
    expect(result.salaryMin).to.be.null;
    expect(result.tags).to.be.an('array').that.is.empty;
  });

  it('should extract multiple tags', () => {
    const html = `
      <html>
        <span class="hidden-xs"><a href="/praca/tagA">TagA</a></span>
        <span class="hidden-xs"><a href="/praca/tagB">TagB</a></span>
        <span class="hidden-xs"><a href="/praca/tagC">TagC</a></span>
      </html>
    `;
    const result = parseProfesia(html, 'id', 'url');
    expect(result.tags).to.include.members(['TagA', 'TagB', 'TagC']);
  });

  it('should parse postedAt date in correct format', () => {
    const html = `
      <html>
        <div class="padding-on-bottom">
          <strong>Dátum zverejnenia</strong>
          <span>1.7.2025</span>
        </div>
      </html>
    `;
    const result = parseProfesia(html, 'id', 'url');
    expect(result.postedAt).to.equal('2025-07-01');
  });
});
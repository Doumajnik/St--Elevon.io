import { expect } from 'chai';
import Reporter from '../utils/reporter.js';

describe('Reporter', () => {
  it('should count jobs, duplicates, and failed jobs', () => {
    const reporter = new Reporter();
    reporter.addJob({ location: 'Bratislava', tags: ['JS'], companyName: 'Test', salaryMin: 1000, salaryMax: 2000, employmentType: 'full' });
    reporter.addDuplicate();
    reporter.addFailed('url');
    expect(reporter.totalJobs).to.equal(1);
    expect(reporter.duplicates).to.equal(1);
    expect(reporter.failed).to.equal(1);
  });

  it('should accumulate tags and locations correctly', () => {
    const reporter = new Reporter();
    reporter.addJob({ location: 'Bratislava', tags: ['JS', 'Node'], companyName: 'A', salaryMin: 1000, salaryMax: 2000, employmentType: 'full' });
    reporter.addJob({ location: 'Bratislava', tags: ['Node', 'React'], companyName: 'B', salaryMin: 1200, salaryMax: 2200, employmentType: 'part' });
    reporter.addJob({ location: 'Kosice', tags: ['JS'], companyName: 'A', salaryMin: 900, salaryMax: 1800, employmentType: 'full' });

    expect(reporter.locations['Bratislava']).to.equal(2);
    expect(reporter.locations['Kosice']).to.equal(1);
    expect(reporter.tags['JS']).to.equal(2);
    expect(reporter.tags['Node']).to.equal(2);
    expect(reporter.tags['React']).to.equal(1);
    expect(reporter.companies['A']).to.equal(2);
    expect(reporter.companies['B']).to.equal(1);
  });

  it('should store failed URLs', () => {
    const reporter = new Reporter();
    reporter.addFailed('http://fail1');
    reporter.addFailed('http://fail2');
    expect(reporter.failedUrls).to.include('http://fail1');
    expect(reporter.failedUrls).to.include('http://fail2');
  });

  it('should calculate salary stats', () => {
    const reporter = new Reporter();
    reporter.addJob({ location: 'Bratislava', tags: [], companyName: 'A', salaryMin: 1000, salaryMax: 2000, employmentType: 'full' });
    reporter.addJob({ location: 'Kosice', tags: [], companyName: 'B', salaryMin: 1500, salaryMax: 2500, employmentType: 'part' });
    expect(reporter.salaries.length).to.equal(2);
    expect(reporter.salaries[0].min).to.equal(1000);
    expect(reporter.salaries[1].max).to.equal(2500);
  });

});
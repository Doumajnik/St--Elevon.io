import { expect } from 'chai';
import { isValid } from '../utils/validator.js';

describe('Job Validator', () => {
  it('should validate correct job data', () => {
    const job = {
      jobId: 'abc',
      jobTitle: 'Developer',
      jobUrl: 'https://www.profesia.sk/praca/abc',
      location: 'Bratislava'
    };
    expect(isValid(job)).to.be.true;
  });

  it('should invalidate job with missing fields', () => {
    const job = { jobId: '', jobTitle: '', jobUrl: '', location: '' };
    expect(isValid(job)).to.be.false;
  });

  it('should invalidate job with invalid URL', () => {
    const job = {
      jobId: 'abc',
      jobTitle: 'Developer',
      jobUrl: 'not-a-url',
      location: 'Bratislava'
    };
    expect(isValid(job)).to.be.false;
  });

  it('should invalidate job with invalid companyUrl', () => {
    const job = {
      jobId: 'abc',
      jobTitle: 'Developer',
      jobUrl: 'https://www.profesia.sk/praca/abc',
      location: 'Bratislava',
      companyUrl: 'not-a-url'
    };
    expect(isValid(job)).to.be.false;
  });

  it('should set postedAt to null if in the future', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10);
    const job = {
      jobId: 'abc',
      jobTitle: 'Developer',
      jobUrl: 'https://www.profesia.sk/praca/abc',
      location: 'Bratislava',
      postedAt: futureDate
    };
    expect(isValid(job)).to.be.true;
    expect(job.postedAt).to.be.null;
  });

  it('should set postedAt to null if invalid date', () => {
    const job = {
      jobId: 'abc',
      jobTitle: 'Developer',
      jobUrl: 'https://www.profesia.sk/praca/abc',
      location: 'Bratislava',
      postedAt: 'not-a-date'
    };
    expect(isValid(job)).to.be.true;
    expect(job.postedAt).to.be.null;
  });

  it('should set tags to empty array if not an array', () => {
    const job = {
      jobId: 'abc',
      jobTitle: 'Developer',
      jobUrl: 'https://www.profesia.sk/praca/abc',
      location: 'Bratislava',
      tags: 'not-an-array'
    };
    expect(isValid(job)).to.be.true;
    expect(job.tags).to.be.an('array').that.is.empty;
  });

  it('should invalidate job with non-numeric salaryMin or salaryMax', () => {
    const job = {
      jobId: 'abc',
      jobTitle: 'Developer',
      jobUrl: 'https://www.profesia.sk/praca/abc',
      location: 'Bratislava',
      salaryMin: 'not-a-number',
      salaryMax: 2000
    };
    expect(isValid(job)).to.be.false;

    const job2 = {
      jobId: 'abc',
      jobTitle: 'Developer',
      jobUrl: 'https://www.profesia.sk/praca/abc',
      location: 'Bratislava',
      salaryMin: 1000,
      salaryMax: 'not-a-number'
    };
    expect(isValid(job2)).to.be.false;
  });

  it('should validate job with optional fields missing', () => {
    const job = {
      jobId: 'abc',
      jobTitle: 'Developer',
      jobUrl: 'https://www.profesia.sk/praca/abc',
      location: 'Bratislava'
      // no optional fields
    };
    expect(isValid(job)).to.be.true;
  });
});
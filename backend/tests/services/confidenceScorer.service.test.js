const confidenceScorer = require('../../src/services/confidenceScorer.service');

describe('confidenceScorer.service', () => {
  it('calculates a bounded confidence score', () => {
    const value = confidenceScorer.calculateConfidence({
      dataQuality: 0.9,
      modelAgreement: 0.8,
      evidenceStrength: 0.85,
      contextRelevance: 0.7,
    });

    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });

  it('returns lower confidence when evidence is weak', () => {
    const highEvidence = confidenceScorer.calculateConfidence({
      dataQuality: 0.8,
      modelAgreement: 0.8,
      evidenceStrength: 0.9,
      contextRelevance: 0.8,
    });

    const lowEvidence = confidenceScorer.calculateConfidence({
      dataQuality: 0.8,
      modelAgreement: 0.8,
      evidenceStrength: 0.2,
      contextRelevance: 0.8,
    });

    expect(lowEvidence).toBeLessThan(highEvidence);
  });

  it('assesses evidence strength with expected floor when empty', () => {
    expect(confidenceScorer.assessEvidenceStrength([])).toBe(0.4);
    expect(confidenceScorer.assessEvidenceStrength(['abnormal glucose trend'])).toBeGreaterThan(0);
  });

  it('generates readable confidence explanation', () => {
    const text = confidenceScorer.generateConfidenceExplanation(0.78, {
      dataQuality: 0.7,
      modelAgreement: 0.75,
      evidenceStrength: 0.8,
      contextRelevance: 0.7,
    });

    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(10);
  });
});

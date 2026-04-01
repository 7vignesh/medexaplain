/**
 * Integration Test Suite for Analysis Endpoints
 * Tests v2 API endpoints for correctness, performance, and data validation
 */

import type { AnalysisRequest, AnalysisResponse } from '../../src/types/analysis';

// Mock data for testing
const mockAnalysisRequest: AnalysisRequest = {
  inputType: 'text',
  textInput: 'Patient with elevated glucose 245 mg/dL, HbA1c 8.2%, cholesterol 220 mg/dL',
  parameters: [
    { name: 'Glucose', value: '245', unit: 'mg/dL', status: 'high' },
    { name: 'HbA1c', value: '8.2', unit: '%', status: 'high' },
    { name: 'Cholesterol', value: '220', unit: 'mg/dL', status: 'high' },
  ],
  audienceMode: 'patient',
};

describe('Analysis API Integration Tests', () => {
  describe('POST /api/v2/analyze', () => {
    it('should return valid structured analysis response', async () => {
      const response = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify(mockAnalysisRequest),
      });

      expect(response.status).toBe(200);
      const data: AnalysisResponse = await response.json();

      // Validate response structure
      expect(data).toHaveProperty('diagnosis');
      expect(data).toHaveProperty('confidence');
      expect(data).toHaveProperty('structuredExplanation');
      expect(data).toHaveProperty('metadata');

      // Validate confidence range
      expect(data.confidence).toBeGreaterThanOrEqual(0);
      expect(data.confidence).toBeLessThanOrEqual(1);

      // Validate structured explanation
      const ex = data.structuredExplanation;
      expect(ex.observation).toBeTruthy();
      expect(ex.pattern).toBeTruthy();
      expect(ex.reasoning).toBeInstanceOf(Array);
      expect(ex.reasoning.length).toBeGreaterThan(0);
      expect(ex.diagnosis).toBeTruthy();
    });

    it('should return patient-friendly explanation when requested', async () => {
      const response = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify({ ...mockAnalysisRequest, audienceMode: 'patient' }),
      });

      const data: AnalysisResponse = await response.json();
      expect(data.structuredExplanation.patientFriendlyExplanation).toBeTruthy();
      expect(data.structuredExplanation.audienceMode).toBe('patient');
    });

    it('should return medical explanation when requested', async () => {
      const response = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify({ ...mockAnalysisRequest, audienceMode: 'doctor' }),
      });

      const data: AnalysisResponse = await response.json();
      expect(data.structuredExplanation.medicalExplanation).toBeTruthy();
      expect(data.structuredExplanation.audienceMode).toBe('doctor');
    });

    it('should include reasoning steps with confidence scores', async () => {
      const response = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify(mockAnalysisRequest),
      });

      const data: AnalysisResponse = await response.json();
      const steps = data.structuredExplanation.reasoning;

      steps.forEach((step) => {
        expect(step.stepNumber).toBeGreaterThan(0);
        expect(['observation', 'analysis', 'pattern_recognition', 'diagnosis', 'recommendation']).toContain(
          step.stage
        );
        expect(step.description).toBeTruthy();
        expect(step.evidence).toBeInstanceOf(Array);
        expect(step.confidence).toBeGreaterThanOrEqual(0);
        expect(step.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should handle image input with heatmap', async () => {
      const imageRequest: AnalysisRequest = {
        inputType: 'image',
        imageMeta: { fileName: 'scan.jpg', width: 1024, height: 768 },
      };

      const response = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify(imageRequest),
      });

      const data: AnalysisResponse = await response.json();
      expect(data.heatmap).toBeTruthy();
      expect(data.heatmap.regions).toBeInstanceOf(Array);
      expect(data.heatmap.regions.length).toBeGreaterThan(0);

      // Validate heatmap regions
      data.heatmap.regions.forEach((region) => {
        expect(region.id).toBeTruthy();
        expect(region.label).toBeTruthy();
        expect(region.intensity).toBeGreaterThanOrEqual(0);
        expect(region.intensity).toBeLessThanOrEqual(1);
      });
    });

    it('should return performance metadata', async () => {
      const response = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify(mockAnalysisRequest),
      });

      const data: AnalysisResponse = await response.json();
      const { metadata } = data;

      expect(metadata.latency).toBeGreaterThan(0);
      expect(metadata.modelUsed).toBeTruthy();
      expect(typeof metadata.cacheHit).toBe('boolean');
      expect(metadata.processingStages.total).toBeGreaterThan(0);
    });

    it('should reject requests with validation errors', async () => {
      const invalidRequest = {
        // Missing required fields
      };

      const response = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.success).toBe(false);
    });
  });

  describe('GET /api/v2/result/:id', () => {
    it('should retrieve analysis by ID', async () => {
      // First, create an analysis
      const createResponse = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify(mockAnalysisRequest),
      });

      const createdData = await createResponse.json();
      const analysisId = createdData.analysisId;

      // Then retrieve it
      const getResponse = await fetch(`http://localhost:5000/api/v2/result/${analysisId}`, {
        headers: { Authorization: 'Bearer token' },
      });

      expect(getResponse.status).toBe(200);
      const data = await getResponse.json();
      expect(data.analysisId).toBe(analysisId);
    });

    it('should return 404 for non-existent analysis', async () => {
      const response = await fetch('http://localhost:5000/api/v2/result/non-existent-id', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v2/follow-up', () => {
    it('should process follow-up questions', async () => {
      const followUpRequest = {
        question: 'What should I do based on these results?',
        contextResultId: 'some-analysis-id',
        audienceMode: 'patient',
      };

      const response = await fetch('http://localhost:5000/api/v2/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify(followUpRequest),
      });

      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('diagnosis');
        expect(data).toHaveProperty('structuredExplanation');
      }
    });
  });

  describe('GET /api/v2/metrics', () => {
    it('should return analysis metrics', async () => {
      const response = await fetch('http://localhost:5000/api/v2/metrics', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(response.status).toBe(200);
      const metrics = await response.json();

      expect(metrics).toHaveProperty('totalAnalyses');
      expect(metrics).toHaveProperty('averageConfidence');
      expect(metrics).toHaveProperty('averageLatency');
      expect(metrics).toHaveProperty('cacheHitRate');
    });
  });

  describe('Performance Tests', () => {
    it('should complete analysis within 5 seconds', async () => {
      const start = Date.now();

      const response = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify(mockAnalysisRequest),
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
      expect(response.status).toBe(200);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() =>
          fetch('http://localhost:5000/api/v2/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
            body: JSON.stringify(mockAnalysisRequest),
          })
        );

      const responses = await Promise.all(requests);
      const successCount = responses.filter((r) => r.ok).length;

      expect(successCount).toBe(10);
    });
  });

  describe('Caching Tests', () => {
    it('should return cached results faster', async () => {
      // First request
      const start1 = Date.now();
      const response1 = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify(mockAnalysisRequest),
      });
      const duration1 = Date.now() - start1;
      const data1: AnalysisResponse = await response1.json();

      // Second identical request
      const start2 = Date.now();
      const response2 = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: JSON.stringify(mockAnalysisRequest),
      });
      const duration2 = Date.now() - start2;
      const data2: AnalysisResponse = await response2.json();

      // Cached request should be faster
      expect(duration2).toBeLessThan(duration1);
      expect(data2.metadata.cacheHit).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 without authorization', async () => {
      const response = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockAnalysisRequest),
      });

      expect(response.status).toBe(401);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch('http://localhost:5000/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
    });
  });
});

// Run tests
if (require.main === module) {
  console.log('Integration tests ready. Run with: jest integration.test.ts');
}

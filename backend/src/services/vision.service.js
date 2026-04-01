const crypto = require('crypto');

class VisionService {
  /**
   * Simulates visual feature extraction from image or text input.
   */
  async analyze(input = {}) {
    const { inputType = 'text', textInput = '', imageMeta = {} } = input;

    const normalizedText = (textInput || '').trim();
    const findings = this.extractFindings(normalizedText);

    if (inputType !== 'image') {
      return {
        modelUsed: 'vision-mock-text-v1',
        visualFindings: findings,
        heatmap: null,
      };
    }

    const seed = `${imageMeta.fileName || 'image'}-${imageMeta.width || 0}-${imageMeta.height || 0}-${normalizedText.slice(0, 48)}`;
    const heatmap = this.createHeatmap(seed, imageMeta);

    return {
      modelUsed: 'vision-mock-image-v1',
      visualFindings: findings,
      heatmap,
    };
  }

  extractFindings(text) {
    if (!text) {
      return [
        'No direct textual biomarkers supplied; inferential reasoning will rely on follow-up context.',
      ];
    }

    const lowered = text.toLowerCase();
    const findings = [];

    if (lowered.includes('glucose') || lowered.includes('sugar')) {
      findings.push('Signal of glycemic irregularity observed in supplied context.');
    }

    if (lowered.includes('hemoglobin') || lowered.includes('hb')) {
      findings.push('Potential oxygen-carrying marker trend noted from hemoglobin references.');
    }

    if (lowered.includes('cholesterol') || lowered.includes('ldl') || lowered.includes('hdl')) {
      findings.push('Lipid metabolism indicators are present and relevant for risk synthesis.');
    }

    if (lowered.includes('creatinine') || lowered.includes('egfr')) {
      findings.push('Kidney-function related markers detected from lab context.');
    }

    if (findings.length === 0) {
      findings.push('General biomarker context detected with mixed normal/abnormal cues.');
    }

    return findings;
  }

  createHeatmap(seed, imageMeta) {
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const width = Number(imageMeta.width) || 1024;
    const height = Number(imageMeta.height) || 768;

    const pick = (offset, max, min = 0) => {
      const value = parseInt(hash.slice(offset, offset + 4), 16);
      return min + (value % Math.max(1, max - min));
    };

    return {
      width,
      height,
      regions: [
        {
          id: 'r1',
          label: 'Suspected abnormal cluster',
          x: pick(0, Math.floor(width * 0.7), Math.floor(width * 0.1)),
          y: pick(4, Math.floor(height * 0.5), Math.floor(height * 0.1)),
          w: pick(8, Math.floor(width * 0.25), Math.floor(width * 0.12)),
          h: pick(12, Math.floor(height * 0.2), Math.floor(height * 0.1)),
          intensity: 0.82,
        },
        {
          id: 'r2',
          label: 'Secondary indicator region',
          x: pick(16, Math.floor(width * 0.8), Math.floor(width * 0.15)),
          y: pick(20, Math.floor(height * 0.8), Math.floor(height * 0.2)),
          w: pick(24, Math.floor(width * 0.2), Math.floor(width * 0.1)),
          h: pick(28, Math.floor(height * 0.18), Math.floor(height * 0.08)),
          intensity: 0.63,
        },
      ],
      note: 'Mock heatmap for explainability preview. Not a diagnostic imaging interpretation.',
    };
  }
}

module.exports = new VisionService();

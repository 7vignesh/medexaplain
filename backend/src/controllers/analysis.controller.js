const analysisService = require('../services/analysis.service');

const analyze = async (req, res) => {
  try {
    const result = await analysisService.createAnalysisJob(req.user._id.toString(), req.body);

    res.status(result.status === 'completed' ? 200 : 202).json({
      success: true,
      message: result.cached ? 'Result served from cache' : 'Analysis accepted',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getResult = async (req, res) => {
  try {
    const data = analysisService.getResult(req.user._id.toString(), req.params.id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getMetrics = async (req, res) => {
  try {
    const data = analysisService.getMetrics();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const data = analysisService.getHistory(req.user._id.toString(), limit);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const askFollowUp = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      followUpQuestion: req.body?.question || req.body?.followUpQuestion || '',
      contextResultId: req.body?.contextResultId || null,
    };

    const data = await analysisService.createAnalysisJob(req.user._id.toString(), payload);

    res.status(data.status === 'completed' ? 200 : 202).json({
      success: true,
      message: data.cached ? 'Follow-up served from cache' : 'Follow-up analysis accepted',
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  analyze,
  getResult,
  getMetrics,
  getHistory,
  askFollowUp,
};

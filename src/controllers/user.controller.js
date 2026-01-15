const asyncHandler = require("express-async-handler");

// @desc    Get logged-in user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

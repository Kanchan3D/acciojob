const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const PlaygroundSession = require('../models/PlaygroundSession');

const router = express.Router();

// Validation middleware
const sessionValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Session name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('language')
    .optional()
    .isIn(['javascript', 'typescript', 'jsx', 'tsx', 'html', 'css'])
    .withMessage('Invalid language')
];

// Get all sessions for a user
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sessions = await PlaygroundSession.find(query)
      .sort({ lastModified: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-messages'); // Exclude messages for list view

    const total = await PlaygroundSession.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: sessions.length,
          totalCount: total
        }
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions'
    });
  }
});

// Get a specific session
router.get('/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const session = await PlaygroundSession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { session }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session'
    });
  }
});

// Create a new session
router.post('/sessions', authMiddleware, sessionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description = '', code = '', language = 'tsx', tags = [], isPublic = false } = req.body;

    const session = new PlaygroundSession({
      userId: req.user._id,
      name,
      description,
      code,
      language,
      tags,
      isPublic,
      messages: []
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session'
    });
  }
});

// Update a session
router.put('/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, code, language, tags, isPublic } = req.body;

    const session = await PlaygroundSession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Update fields if provided
    if (name !== undefined) {
      if (!name.trim() || name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Session name must be between 1 and 100 characters'
        });
      }
      session.name = name.trim();
    }
    
    if (description !== undefined) session.description = description;
    if (code !== undefined) session.code = code;
    if (language !== undefined) {
      if (!['javascript', 'typescript', 'jsx', 'tsx', 'html', 'css'].includes(language)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid language'
        });
      }
      session.language = language;
    }
    if (tags !== undefined) session.tags = tags;
    if (isPublic !== undefined) session.isPublic = isPublic;

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session'
    });
  }
});

// Add message to session
router.post('/sessions/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { role, content } = req.body;

    if (!role || !content) {
      return res.status(400).json({
        success: false,
        message: 'Role and content are required'
      });
    }

    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "user" or "assistant"'
      });
    }

    const session = await PlaygroundSession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.messages.push({
      role,
      content,
      timestamp: new Date()
    });

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Message added successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message'
    });
  }
});

// Delete a session
router.delete('/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const session = await PlaygroundSession.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session'
    });
  }
});

// Get public sessions (for discovery)
router.get('/public', optionalAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', tags = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = { isPublic: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const sessions = await PlaygroundSession.find(query)
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-messages'); // Exclude messages for list view

    const total = await PlaygroundSession.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: sessions.length,
          totalCount: total
        }
      }
    });
  } catch (error) {
    console.error('Get public sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public sessions'
    });
  }
});

module.exports = router;

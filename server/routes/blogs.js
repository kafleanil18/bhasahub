const express = require('express');
const Blog = require('../models/Blog');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

// GET /api/blogs — public: published posts, newest first
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch {
    res.status(500).json({ error: 'Could not load blogs' });
  }
});

// GET /api/blogs/all — admin: all posts
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch {
    res.status(500).json({ error: 'Could not load blogs' });
  }
});

// GET /api/blogs/:id — one post
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Post not found' });
    res.json(blog);
  } catch {
    res.status(500).json({ error: 'Could not load post' });
  }
});

// POST /api/blogs — admin: create
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const blog = await Blog.create(req.body);
    logActivity(req, { action: 'create', resourceType: 'blog', resourceId: blog._id, label: blog.title });
    res.status(201).json(blog);
  } catch {
    res.status(500).json({ error: 'Could not create post' });
  }
});

// PUT /api/blogs/:id — admin: update
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) return res.status(404).json({ error: 'Post not found' });
    logActivity(req, { action: 'update', resourceType: 'blog', resourceId: blog._id, label: blog.title });
    res.json(blog);
  } catch {
    res.status(500).json({ error: 'Could not update post' });
  }
});

// DELETE /api/blogs/:id — admin: delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (blog) logActivity(req, { action: 'delete', resourceType: 'blog', resourceId: blog._id, label: blog.title });
    res.json({ message: 'Post deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete post' });
  }
});

module.exports = router;
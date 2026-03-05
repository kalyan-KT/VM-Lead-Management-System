const express = require('express');
const router = express.Router();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { getFolders, createFolder, deleteFolder, updateFolder } = require('../controllers/folders.controller');

// All routes require authentication
router.use(ClerkExpressRequireAuth());

router.route('/')
    .get(getFolders)
    .post(createFolder);

router.route('/:id')
    .put(updateFolder)
    .delete(deleteFolder);

module.exports = router;

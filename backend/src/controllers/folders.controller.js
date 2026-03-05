const Folder = require('../models/Folder');

// @desc    Get all folders for a user
// @route   GET /api/folders
// @access  Private
exports.getFolders = async (req, res) => {
    try {
        const { userId } = req.auth;
        const folders = await Folder.find({ createdBy: userId }).sort({ name: 1 });
        res.status(200).json(folders);
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
exports.createFolder = async (req, res) => {
    try {
        const { userId } = req.auth;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Folder name is required' });
        }

        const existingFolder = await Folder.findOne({ name, createdBy: userId });
        if (existingFolder) {
            return res.status(400).json({ message: 'Folder already exists' });
        }

        const folder = await Folder.create({ name, createdBy: userId });
        res.status(201).json(folder);
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a folder
// @route   DELETE /api/folders/:id
// @access  Private
exports.deleteFolder = async (req, res) => {
    try {
        const { userId } = req.auth;
        const folder = await Folder.findOneAndDelete({ _id: req.params.id, createdBy: userId });

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found or unauthorized' });
        }

        res.status(200).json({ message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a folder
// @route   PUT /api/folders/:id
// @access  Private
exports.updateFolder = async (req, res) => {
    try {
        const { userId } = req.auth;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Folder name is required' });
        }

        const folder = await Folder.findOneAndUpdate(
            { _id: req.params.id, createdBy: userId },
            { name },
            { new: true }
        );

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found or unauthorized' });
        }

        res.status(200).json(folder);
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ message: error.message });
    }
};

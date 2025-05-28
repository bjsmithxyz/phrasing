const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const logger = require('./logger');
const cache = require('./cache');

class FileManager {
  constructor() {
    this.mdPath = config.paths.markdownFiles;
  }

  /**
   * Validate if file is a valid markdown file
   */
  isValidMarkdownFile(filename) {
    return filename.endsWith('.md') && 
           !filename.startsWith('.') && 
           !filename.includes('..') &&
           filename.length > 0;
  }

  /**
   * Get all markdown files in directory
   */
  async getMarkdownFiles() {
    const cacheKey = cache.generateKey('markdown_files');
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      await fs.access(this.mdPath);
      const files = await fs.readdir(this.mdPath);
      const markdownFiles = files.filter(this.isValidMarkdownFile);
      
      // Sort files alphabetically
      markdownFiles.sort();
      
      cache.set(cacheKey, markdownFiles);
      logger.dev('Found markdown files', { count: markdownFiles.length });
      
      return markdownFiles;
    } catch (error) {
      logger.error('Failed to read markdown directory', error, { 
        path: this.mdPath 
      });
      throw new Error(`Cannot access markdown directory: ${this.mdPath}`);
    }
  }

  /**
   * Read a single markdown file
   */
  async readMarkdownFile(filename) {
    if (!this.isValidMarkdownFile(filename)) {
      throw new Error(`Invalid markdown file: ${filename}`);
    }

    const cacheKey = cache.generateKey('file_content', filename);
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const filePath = path.join(this.mdPath, filename);
      const content = await fs.readFile(filePath, 'utf8');
      
      cache.set(cacheKey, content);
      logger.dev('Read markdown file', { filename, size: content.length });
      
      return content;
    } catch (error) {
      logger.error('Failed to read markdown file', error, { filename });
      throw new Error(`Cannot read file: ${filename}`);
    }
  }

  /**
   * Read all markdown files and return their contents
   */
  async getAllFileContents() {
    const cacheKey = cache.generateKey('all_file_contents');
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const start = Date.now();
    
    try {
      const files = await this.getMarkdownFiles();
      
      if (files.length === 0) {
        const emptyResult = { files: [], contents: [], metadata: {} };
        cache.set(cacheKey, emptyResult);
        return emptyResult;
      }

      // Read all files in parallel with error handling
      const filePromises = files.map(async (file) => {
        try {
          const content = await this.readMarkdownFile(file);
          return { file, content, success: true };
        } catch (error) {
          logger.warn('Failed to read file during batch operation', error, { file });
          return { file, content: '', success: false, error: error.message };
        }
      });

      const results = await Promise.all(filePromises);
      
      // Separate successful and failed reads
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      const fileContents = {
        files: successful.map(r => r.file),
        contents: successful.map(r => r.content),
        metadata: {
          totalFiles: files.length,
          successfulReads: successful.length,
          failedReads: failed.length,
          readTime: Date.now() - start,
          failedFiles: failed.map(r => ({ file: r.file, error: r.error })),
        }
      };

      cache.set(cacheKey, fileContents);
      
      logger.performance('file_read_batch', Date.now() - start, {
        totalFiles: files.length,
        successful: successful.length,
        failed: failed.length,
      });

      if (failed.length > 0) {
        logger.warn('Some files failed to read', { 
          failedCount: failed.length,
          failedFiles: failed.map(r => r.file),
        });
      }

      return fileContents;
    } catch (error) {
      logger.error('Failed to read file contents', error);
      throw error;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats() {
    const cacheKey = cache.generateKey('file_stats');
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const fileContents = await this.getAllFileContents();
      const { contents, metadata } = fileContents;
      
      const stats = {
        totalFiles: metadata.totalFiles,
        totalCharacters: contents.reduce((sum, content) => sum + content.length, 0),
        totalLines: contents.reduce((sum, content) => sum + content.split('\n').length, 0),
        totalWords: contents.reduce((sum, content) => sum + content.split(/\s+/).length, 0),
        averageFileSize: metadata.totalFiles > 0 ? 
          Math.round(contents.reduce((sum, content) => sum + content.length, 0) / metadata.totalFiles) : 0,
        readTime: metadata.readTime,
        lastUpdated: new Date().toISOString(),
      };

      cache.set(cacheKey, stats);
      return stats;
    } catch (error) {
      logger.error('Failed to calculate file stats', error);
      throw error;
    }
  }

  /**
   * Watch for file changes (development feature)
   */
  watchFiles(callback) {
    if (config.server.env !== 'development') {
      return;
    }

    try {
      const watcher = fs.watch(this.mdPath, { recursive: false }, (eventType, filename) => {
        if (filename && this.isValidMarkdownFile(filename)) {
          logger.dev('File change detected', { eventType, filename });
          
          // Invalidate relevant cache entries
          cache.invalidate('markdown_files|file_content_|all_file_contents|file_stats');
          
          if (callback) {
            callback(eventType, filename);
          }
        }
      });

      logger.info('File watcher started', { path: this.mdPath });
      return watcher;
    } catch (error) {
      logger.warn('Failed to start file watcher', error);
      return null;
    }
  }

  /**
   * Initialize file manager
   */
  async initialize(markdownPath) {
    if (markdownPath) {
      this.mdPath = markdownPath;
    }
    
    await this.validateDirectory();
    
    if (config.development.fileWatcher) {
      this.startWatcher();
    }
    
    logger.info('FileManager initialized', { 
      path: this.mdPath,
      watcherEnabled: config.development.fileWatcher 
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.watcher) {
      this.watcher.close();
      logger.info('File watcher stopped');
    }
  }

  /**
   * Validate markdown directory exists and is accessible
   */
  async validateDirectory() {
    try {
      const stats = await fs.stat(this.mdPath);
      
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${this.mdPath}`);
      }

      // Test read permissions
      await fs.access(this.mdPath, fs.constants.R_OK);
      
      logger.dev('Markdown directory validated', { path: this.mdPath });
      return true;
    } catch (error) {
      logger.error('Markdown directory validation failed', error, { 
        path: this.mdPath 
      });
      throw new Error(`Invalid markdown directory: ${this.mdPath}`);
    }
  }
}

module.exports = new FileManager();

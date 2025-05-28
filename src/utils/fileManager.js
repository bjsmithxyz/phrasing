const fs = require('fs').promises;
const path = require('path');

class FileManager {
  constructor() {
    this.mdPath = './md_files';
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
    try {
      await fs.access(this.mdPath);
      const files = await fs.readdir(this.mdPath);
      const markdownFiles = files.filter(this.isValidMarkdownFile);
      
      // Sort files alphabetically
      markdownFiles.sort();
      
      return markdownFiles;
    } catch (error) {
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

    try {
      const filePath = path.join(this.mdPath, filename);
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Cannot read file: ${filename}`);
    }
  }

  /**
   * Read all markdown files and return their contents
   */
  async getAllFileContents() {
    try {
      const files = await this.getMarkdownFiles();
      
      if (files.length === 0) {
        return { files: [], contents: [] };
      }

      // Read all files in parallel
      const filePromises = files.map(async (file) => {
        try {
          const content = await this.readMarkdownFile(file);
          return { file, content, success: true };
        } catch (error) {
          console.warn(`Failed to read file ${file}:`, error.message);
          return { file, content: '', success: false };
        }
      });
      
      const results = await Promise.all(filePromises);
      
      // Separate successful and failed reads
      const successful = results.filter(r => r.success);
      
      return {
        files: successful.map(r => r.file),
        contents: successful.map(r => r.content)
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FileManager();

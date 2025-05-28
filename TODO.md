# Phrasing Project - Simple TODO

## Current Status

✅ **Project Simplified**: Successfully reverted from enterprise-level application to simple markdown phrase browser

## Completed Simplification

- ✅ Removed Docker, CI/CD, testing framework
- ✅ Removed admin interface and complex features  
- ✅ Simplified dependencies from 20+ to 4 core packages
- ✅ Rewritten core files to be simple and maintainable
- ✅ Cleaned up CSS from 1282 lines to ~300 lines essential styles

## Simple Future Enhancements (Optional)

- 🔄 **Theme Improvements**: Add more theme options or color schemes
- 🔄 **Content Organization**: Better markdown file organization/categorization
- 🔄 **Performance**: Add basic client-side caching for better navigation
- 🔄 **Accessibility**: Improve keyboard navigation and screen reader support

## Development Notes

- Keep the project simple - resist scope creep
- Focus on core functionality: browsing markdown files
- Any new features should be minimal and optional
- Maintain the lightweight, single-purpose nature

## Dependencies

Current minimal stack:

- `express` - Web server
- `ejs` - Template engine  
- `markdown-it` - Markdown processing
- `markdown-it-anchor` - Anchor link generation
- `nodemon` - Development auto-reload (dev only)

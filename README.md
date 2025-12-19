# Colorant Picker

A web app for exploring dye color combinations in Final Fantasy XIV.

## Features

- **Picker**: Browse all available dyes and find harmonious color combinations based on color theory
- **Showcase**: Discover popular palettes shared by the community
- **Favorites**: Save your favorite combinations locally
- **History**: View your recently explored combinations
- **Custom Colors**: Create and use your own custom colors
- **Filters**: Filter by dye categories, exclude metallic dyes
- **Share**: Share your palettes via URL

## Tech Stack

- **Frontend**: SvelteKit (Svelte 5), TypeScript, Tailwind CSS, DaisyUI
- **Backend**: Cloudflare Pages Functions, D1 (SQLite), KV
- **Deployment**: Cloudflare Pages

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Start with Pages Functions (D1/KV)
npm run build && npm run dev:pages

# Type check
npm run check

# Format
npm run format:fix
```

## Contributing

### Translations

If you'd like to see this app in your language, please submit a translation JSON file for the dye names via PR.

### Other Contributions

Feel free to open an issue for:
- Bug reports
- Feature requests
- Any suggestions or feedback

Or reach me on [X](https://x.com/pl4rd) or [Lodestone](https://jp.finalfantasyxiv.com/lodestone/character/27344914/blog/5609012/)

## License

MIT

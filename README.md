# Personal Website

## 🚀 Project Structure

Inside of Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Languages

English keeps the original URLs (`/`, `/about`, `/blog/<slug>`). Polish pages
use the `/pl/` prefix. The header switches to the equivalent page in the other
language. UI translations live in `src/i18n/pl.json`; shared templates use
`translate()` and `localizedPath()` from `src/i18n/index.ts`.

Keep an English article in `src/content/blog/` and its Polish translation in
`src/content/blogpl/`, with the same filename (and therefore slug). Translate
the title, description, and prose; retain executable examples and tag identifiers.
Use ISO dates (`YYYY-MM-DD`) to avoid timezone-dependent publication dates.
Each language has its own RSS feed: `/rss.xml` and `/pl/rss.xml`.

After building, run `python3 scripts/check-localization.py` to check language
pairs, navigation, article listings, metadata, and RSS links in the generated site.

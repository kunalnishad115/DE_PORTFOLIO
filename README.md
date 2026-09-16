# Kunal Nishad — Data Engineering Portfolio

A responsive, dark portfolio inspired by the INTERFACE reference: split-flap lettering, fine grid backgrounds, subtle motion, and warm accents. Built with Vite, vanilla JavaScript, and CSS. Content is based on the supplied resume.

## Run locally

```sh
npm install
npm run dev
```

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm`.

## Build

```sh
npm run build
npm run preview
```

Deploy the generated `dist` folder to any static host. No environment variables or backend are required. Google Fonts is optional; local fallback fonts are included in the CSS stack.

## Deploy to Vercel

Import this repository in Vercel and use the repository root as the Root Directory. The included `vercel.json` selects Vite, installs with `npm ci`, builds with `npm run build`, and publishes `dist`. No environment variables are needed. The site uses section anchors, so it does not need a catch-all route rewrite; the resume PDF and other public files are served directly.

Configuration follows [Vercel's project configuration documentation](https://vercel.com/docs/project-configuration/vercel-json).

## Update content

- Edit projects and skills in `src/data.js`. The navigation project count updates automatically.
- Set each project's `repository` field to its actual repository URL. Until then, the project detail panel clearly links to your GitHub profile.
- Use `documentation` for a project write-up instead of a repository. The Azure multi-source pipeline links to Google Docs; RAGPulse links directly to its GitHub repository.
- Edit biography, experience, contact information, and metadata in `index.html`.
- Replace `public/Kunal_Nishad_Resume.pdf` to update the resume.
- Adjust colors, layout, and motion in `src/style.css`.
- Enhanced animations live in `src/motion.js` and `src/motion.css`: split-flap cycling, a seamless technology marquee, scroll reveals, a reading-progress line, and pointer-driven card effects. The hero motion control pauses animations; system reduced-motion preferences are respected, and decorative looping motion pauses in hidden tabs.
- Projects collect into a sticky overlapping stack as you scroll, with covered cards scaling back slightly. Stacking reverses when scrolling up and releases before About. It switches to a normal list when motion is disabled or the viewport cannot fit a whole card. Keyboard focus scrolls a covered card into view.
- The Uber project includes hybrid Azure batch/stream ingestion, OBT enrichment, SDP, AUTO CDC, and a final star schema, with a direct repository link.

Project diagrams are visual summaries of the resume, not live pipeline monitors. The site includes keyboard-accessible project dialogs, reduced-motion support, optional interaction sounds, a copy-email action, and downloadable resume links.

## Browser verification

Start the dev server, then run `npm run test:ui`. The browser test uses a locally installed Microsoft Edge and checks desktop/mobile layouts, project dialogs, navigation, resume delivery, copy email, and reduced motion.

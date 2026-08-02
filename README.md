# SCIPL website — prototype

A working prototype of a proposed website for **Shree Commercial Interiors Pvt. Ltd.**
Three pages, real content, three visual identities switchable live.

- `index.html` — home
- `work.html` — project index, filterable by sector, city and capability
- `project.html?p=<slug>` — a project page

The panel at the bottom-left switches **identity** (Blueprint / Signal / Imprint),
**units** (sq ft / sq m) and **motion** (on / reduced). All three persist between visits.

## Status

This is a prototype for review, not a finished site. Anything marked **◇** with a dotted
underline is placeholder content awaiting material from SCIPL — dates, programme,
consultants, certifications, team names and all case-study narrative. Client names,
locations, areas and photographs are real, taken from the 2026 company profile.

The before/after slider currently pairs two photographs of the same finished space,
because no bare-shell site photography exists yet. Each project page says so.

## Built with

No framework and no build step — three HTML files, two stylesheets and one script of
about 400 lines. The homepage loads in six requests. Images are pre-generated at four
widths in WebP and JPEG and are never upscaled; each carries a grade that decides how
large the layout is allowed to show it.

## Not for indexing

`robots.txt` and per-page `noindex` tags keep this out of search results. Please treat
the URL as semi-private and share it directly rather than linking to it publicly.

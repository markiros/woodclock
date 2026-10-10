# Repository Guidelines

## Project Structure & Module Organization

`WoodClock/Sources/` contains the Swift macOS screen saver: the view and animation logic, preset loading, settings, and configuration sheet. `WoodClock/Presets/<id>/` holds each clock face's `preset.json`, layered PNG artwork, and preview; add presets by copying this structure. Shared app resources live in `WoodClock/Resources/`. `tools/` contains the SVG dial generator (`dial.js`), rendering and composition scripts, and visual prototypes. `project.yml` is the XcodeGen project definition; generated project files and build output are disposable.

## Build, Test, and Development Commands

- `make build` generates `WoodClock.xcodeproj` with XcodeGen and builds a Release universal (`arm64` and `x86_64`) screen saver.
- `make install` builds and copies the saver to `~/Library/Screen Savers`; `make uninstall` removes it.
- `make clean` removes build output and the generated Xcode project.
- `make presets` rerenders preset artwork. It needs Python 3, Pillow, Playwright with Chromium, and the Bodoni Moda and Cormorant Garamond fonts; see `README.md`.
- `python3 tools/compose_check.py WoodClock/Presets check.png` composes preset layers into an image for visual inspection.

There is no test suite configured. After code changes, run `make build`; after artwork changes, inspect the rendered/composed images and confirm each `preset.json` references valid layers.

## Coding Style & Naming Conventions

Follow the existing Swift style: four-space indentation, descriptive `UpperCamelCase` type names, and `lowerCamelCase` properties and methods. Keep screen saver behavior in `WoodClock/Sources/` and preset-specific artwork/configuration in its own directory. Use lowercase, stable preset IDs (for example, `maple`) and keep layer filenames and JSON keys consistent with existing presets. Match the surrounding JavaScript and Python style when editing tools; no formatter or linter is configured.

## Commit & Pull Request Guidelines

This checkout has no Git history available to establish commit conventions; use concise imperative commit subjects (for example, `Add walnut dial preset`). In pull requests, describe the user-visible change, list build or visual checks performed, and include screenshots for artwork or UI changes. Link related issues when applicable and call out added preset assets or required tooling.

## Configuration & Generated Files

Change build settings in `project.yml`, not the generated `.xcodeproj`. Avoid committing local build products or generated previews unless they are intentional preset assets. Preset JSON and image layers ship as bundle resources, so keep their paths and casing aligned.

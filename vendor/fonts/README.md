# Local course typography

`seeing-serif.woff2` is a 600-weight subset of Noto Serif SC.
`seeing-sans.woff2` is a variable-weight subset of Noto Sans SC.
Both are bundled so the classroom does not depend on a font CDN.

Sources: the Noto SC fonts distributed with Windows; original projects:

- https://github.com/notofonts/noto-cjk
- https://github.com/google/fonts/tree/main/ofl/notoserifsc
- https://github.com/google/fonts/tree/main/ofl/notosanssc

The fonts are licensed under the SIL Open Font License 1.1; see the accompanying
`OFL.txt` and `OFL-sans.txt`. Subset filenames intentionally differ from the
original filenames. Glyph coverage contains the course's JavaScript text and
printable ASCII. Unsupported characters use the system font fallback.

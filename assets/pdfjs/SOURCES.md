PDF.js library and worker: Mozilla PDF.js 3.11.174, obtained from cdnjs/cdnjs GitHub mirror, ajax/libs/pdf.js/3.11.174. These match the original application's PDF engine version.
Library Git blob: c31b6ab62a57edd79441ca939bb7e18fc1b09c63. Exact library/worker bytes were checked against Git blob IDs; SHA-256 is also recorded in precache-manifest.js.
Worker Git blob: 12242260905b0f82831f735be91e231d17a1a57d.
Packed CMaps and standard-font data: Mozilla pdfjs-dist 5.4.624 distribution already available in the execution environment. These are static font/mapping assets, not JavaScript engine upgrades. Standard-font PDF decoding is tested with the pinned 3.11.174 engine. PDF.js is licensed under Apache-2.0; font license files are preserved in standard_fonts.

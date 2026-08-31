# [1.1.0](https://github.com/arienshibani/office-chess-club/compare/v1.0.0...v1.1.0) (2026-08-31)


### Bug Fixes

* **docker:** start MongoDB replica set before app depends on it ([f285fe4](https://github.com/arienshibani/office-chess-club/commit/f285fe47b485d3e8131c758fc2f1c59b0564738d))


### Features

* **admin:** unify settings toggles and add board draft assignment control ([5b7613b](https://github.com/arienshibani/office-chess-club/commit/5b7613bde09527c227d956bffb7f613bda11add9))
* **DOM anchor IDs for chess moves:** implement move hash parsing to the URL. ([277bc62](https://github.com/arienshibani/office-chess-club/commit/277bc622c6f9de695bc85d7490c9292b2c3a71ba))
* **matches:** add board draft creation, finalization, and filtering ([5ebb601](https://github.com/arienshibani/office-chess-club/commit/5ebb6015c36ce6c69b6369d2e18daa154b206ad6))
* **submit:** add board drafts tab with game preview and player assignment ([271329e](https://github.com/arienshibani/office-chess-club/commit/271329e3b7488acecb8b56c3715098e426c96ab5))

# 1.0.0 (2026-06-24)


### Bug Fixes

* **check:** resolve svelte-check errors for CI ([0a1c383](https://github.com/arienshibani/office-chess-club/commit/0a1c3837dbf8430ec4e7a4467c067cc3dc7d110f))
* **ci:** stabilize MongoDB setup for integration tests ([dae3db4](https://github.com/arienshibani/office-chess-club/commit/dae3db483c4cf16ecaa4d15c5f3304f0a858a189))
* **docker:** stabilize dev startup after dependency changes ([792d32b](https://github.com/arienshibani/office-chess-club/commit/792d32b50b9a7df07352235d321408880c175885))
* **env:** use dynamic private env for Vercel builds ([d947d07](https://github.com/arienshibani/office-chess-club/commit/d947d07282d2231af2e8459cc93466c9e51e4183))
* **homepage:** Adjust ui, create more space for the recent matches (more width) ([416381a](https://github.com/arienshibani/office-chess-club/commit/416381a1bf6f0c209cab45314d7457e7501fe4cb))
* **players:** open matches from history rows ([8df52b8](https://github.com/arienshibani/office-chess-club/commit/8df52b8a23bdfb2783ce8c63027531fe18b80b22))
* **stockfish:** keep eval bar decisive at checkmate ([d0a80b2](https://github.com/arienshibani/office-chess-club/commit/d0a80b2d53f0da1bfb7eef99d232c84abca378d1))
* **types:** add JSDoc types for strict check ([da1687c](https://github.com/arienshibani/office-chess-club/commit/da1687c4753ffae5d40d14fef7755c067a37bbff))


### Features

* **admin:** add HTTP submit and Slack settings ([2009976](https://github.com/arienshibani/office-chess-club/commit/20099762b97b75e7a47800a9d7f3d444f634e7f6))
* **api:** integrate Swagger UI for API documentation and add OpenAPI specification ([8000b74](https://github.com/arienshibani/office-chess-club/commit/8000b74114a9ab89552fab6cca0aff4fc286d537))
* **auth:** auto-promote first user when enabled ([8b75753](https://github.com/arienshibani/office-chess-club/commit/8b75753d931622d59d582f8ff4d5a31a7af4bce7))
* **auth:** enable public browsing and tighten access controls ([590e392](https://github.com/arienshibani/office-chess-club/commit/590e39267e38d61993c9ba383dc492f7760670ae))
* **docker:** add Compose stack for local dev ([af2e571](https://github.com/arienshibani/office-chess-club/commit/af2e5715bd995362b1d88016782d99813a5715fe))
* **errors:** add shared error UI and server handling ([4f79dfb](https://github.com/arienshibani/office-chess-club/commit/4f79dfb7652673036c81f736a3d81100972c2922))
* match analysis, admin tools, and UI polish ([5452b58](https://github.com/arienshibani/office-chess-club/commit/5452b58750906a1d59ece9f1265f095c6d2a7c42))
* **matches:** add admin actions menu ([c743e48](https://github.com/arienshibani/office-chess-club/commit/c743e485d669faf47caa026f3263a7a53941bf65))
* **matches:** add match review UI and home showcase ([748ecd6](https://github.com/arienshibani/office-chess-club/commit/748ecd6467c21de72086ac526bb4aef280d89313))
* **matches:** add time format across flows ([3a33c38](https://github.com/arienshibani/office-chess-club/commit/3a33c38952a05f373e4ab5cbcf0f2a3549118922))
* **notifications:** add Discord webhook support ([0ce7db1](https://github.com/arienshibani/office-chess-club/commit/0ce7db13b6b3c26dbc72b4ccb5e0286639310cf5))
* require admin approval before new users can submit matches ([1ba48e5](https://github.com/arienshibani/office-chess-club/commit/1ba48e541c1f4db23071e0a9e582ba75d8708410))
* **ui:** add toast feedback and live refresh ([5aec49f](https://github.com/arienshibani/office-chess-club/commit/5aec49ff9bb6fce89e1c3454d283937e698dcef7))
* **ui:** enhance dashboard layout and add GitHub link ([57039a8](https://github.com/arienshibani/office-chess-club/commit/57039a8266679aae5770d836a38bec28deb83ff8))
* **ui:** improve responsive layout and nav ([5414b8a](https://github.com/arienshibani/office-chess-club/commit/5414b8aca230c4ba9d2857c37aafb245b85292d5))

# Changelog

All notable changes to this project are documented in this file.
Release notes are generated automatically from conventional commits.

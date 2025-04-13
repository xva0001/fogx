# FogX: An Encrypted Social Media Platform
=====================================

## Introduction
FogX is designed to provide users with a secure and private social media experience. It utilizes end-to-end encryption to protect user data and ensures that all communications are ephemeral, leaving no permanent digital record. This platform addresses common privacy concerns found in traditional social media platforms by giving users full control over their data and interactions.

## Table of Contents
1. [Introduction](#introduction)
2. [Built With](#built-with)
3. [Technologies Used](#technologies-used)
4. [Requirements](#requirements)
5. [Installation Instructions](#installation-instructions)
6. [Architecture and Requirements](#architecture-and-requirements)
7. [Functional Requirements](#functional-requirements)
8. [Setup and Development](#setup-and-development)

## Built With
* [![Vue][Vue.js]][Vue-url]
* [![Nuxt][Nuxt]][Nuxt-url]
* [![Mongodb][Mongodb]][Mongodb-url]

[Vue.js]: https://img.shields.io/badge/Vue.js-4FC08D?logo=vuedotjs&logoColor=fff
[Vue-url]: https://vuejs.org/

[Nuxt]: https://img.shields.io/badge/Nuxt-002E3B?logo=nuxt&logoColor=#00DC82
[Nuxt-url]: https://nuxt.com/

[MongoDB]: https://img.shields.io/badge/MongoDB-%234ea94b.svg?logo=mongodb&logoColor=white
[MongoDB-url]: https://www.mongodb.com/

## Technologies Used
- Frontend: Nuxt.js (Vue.js framework) for web applications.
- Backend: Node.js for handling real-time data and scalability.
- Database: MongoDB for efficient data management.
- Encryption: Industry-standard end-to-end encryption protocols.

## Requirements
- Node.js (latest version)
- npm (latest version)
- MongoDB
- Nuxt.js
- Node.js environment for backend operations

## Installation Instructions
1. Install Node.js and npm: Download from [nodejs.org](https://nodejs.org/en/download/).
2. Set up MongoDB: Follow the database setup instructions.
3. Clone the FogX repository: Use Git to clone the project.
4. Install dependencies:
   - npm: npm install
   - pnpm: pnpm install
   - yarn: yarn install
   - bun: bun install
5. Start the server:
   - npm: npm run dev
   - pnpm: pnpm dev
   - yarn: yarn dev
   - bun: bun run dev
6. Access the platform: Open a web browser and navigate to the specified URL.

## Architecture and Requirements

### Data Architecture
- NoSQL Databases: MongoDB for handling unstructured and semi-structured data.
- Distributed Architecture: Data distributed across multiple servers for scalability and performance.
- High Performance: Fast read and write operations for handling large-scale data.
- High Availability: Built-in data replication and failover mechanisms for reliability.

### System Architecture
- Thin Client-Server Architecture: Logical processing on the server side for easier maintenance.
- Four-Tier Client-Server Architecture: Client, Application, Middleware, and Data tiers for organized functionality.

## Functional Requirements
- Register an Account: Generate unique user IDs and recommend secure passwords.
- Server Password Management: Use robust encryption for server password storage.
- Posts: View, create, modify, and delete posts with optional encryption.
- Communicate with Other Users: Secure messaging using end-to-end encryption.

## Setup and Development
### Development Server
Start the development server on http://localhost:3000:
- npm: npm run dev
- pnpm: pnpm dev
- yarn: yarn dev
- bun: bun run dev

### Production
Build the application for production:
- npm: npm run build
- pnpm: pnpm build
- yarn: yarn build
- bun: bun run build

Locally preview production build:
- npm: npm run preview
- pnpm: pnpm preview
- yarn: yarn preview
- bun: bun run preview
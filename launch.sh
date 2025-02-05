#!/bin/bash
cd "${0%/*}"


npm install --save three
npm install --save-dev vite
npx vite

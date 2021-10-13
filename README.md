# Setup (see GitHub project wiki page)
- Copied files over
- `npm install ...`
- `npm install --save-dev jest`
- Issues with babel, etc.
  - Follow: 
    - https://codeburst.io/https-chidume-nnamdi-com-npm-module-in-typescript-12b3b22f0724
  - Setup `tsconfig.json`:
    - `"esModuleInterop": true`
  - https://jestjs.io/docs/en/getting-started
    - `npm i -D babel-jest @babel/core @babel/preset-env`
    - Create `babel.config.js`
    - https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
        - `jestconfig.json`

- https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
- For detailed instructions on bit.dev: https://paper.dropbox.com/doc/Integrating-Node-Projects-with-Bit--BDNpRKLuMzDtsiRXXhkLgPWOAg-nsRTbQ2RqdOAgr8dYLfLl
        
        
# Known issues:

- There is an issue because the dependency on `color.js` which uses ES2021 syntax you may 
  get an error like "You may need an additional loader to handle the result of these loaders" on
  the line that writes a number like "0.039_245".
  To fix see: https://github.com/facebook/create-react-app/issues/9468
  and change the bottom of `package.json` the "browserslist" to
```
  "browserslist": [
    ">0.2%",
    "not dead",
    "not op_mini all"
  ]
```
  Also have to delete `/node_modules/.cache`
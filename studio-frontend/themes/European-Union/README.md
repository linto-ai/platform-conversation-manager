# LinTO Studio – EU theme

## Installation

Clone (or link) the repo to `<LinTO Studio frontend dir>/theme/`

Edit `<LinTO Studio frontend dir>/theme/index.js`

```diff
 import LinTOGreen from "./LinTO-green/index.js"
+import UETheme from "./linto-studio-eu-theme/index.js"
 
 export default {
   "LinTO-green": LinTOGreen,
+  "UE-theme": UETheme,
 }
```

Set `VUE_APP_THEME=UE-theme` in your environnement variables